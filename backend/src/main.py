import json
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import Client, create_client


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    VITE_SUPABASE_URL: str = ""
    VITE_SUPABASE_ANON_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file="../../.env",
        extra="ignore",
    )


settings = Settings()

SUPABASE_URL = settings.SUPABASE_URL or settings.VITE_SUPABASE_URL
SUPABASE_KEY = (
    settings.SUPABASE_ANON_KEY
    or settings.VITE_SUPABASE_ANON_KEY
)

supabase: Optional[Client] = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


app = FastAPI(
    title="Stack Survivors API",
    description="FastAPI Backend for Stack Survivors",
    version="0.2.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


SUPPORTED_SKILLS = {
    "C",
    "C++",
    "HTML",
    "Java",
    "JavaScript",
    "Python",
    "React",
}


class ScoreRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    survival_time: float = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    correct_answers: int = Field(default=0, ge=0)
    user_id: Optional[str] = None


def require_supabase() -> Client:
    if supabase is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase not configured",
        )

    return supabase


def normalize_options(raw_options: Any) -> list[str]:
    """
    아래 형태를 모두 처리합니다.

    정상 JSON 배열:
        ["A", "B", "C", "D"]

    JSON 문자열:
        '["A", "B", "C", "D"]'

    배열 안에 JSON 문자열이 들어간 잘못된 형태:
        ['["A", "B", "C", "D"]']
    """

    parsed = raw_options

    # JSON 문자열이면 파싱
    if isinstance(parsed, str):
        try:
            parsed = json.loads(parsed)
        except json.JSONDecodeError:
            return []

    if not isinstance(parsed, list):
        return []

    # ['["A", "B", "C", "D"]'] 형태 복구
    if len(parsed) == 1 and isinstance(parsed[0], str):
        nested_value = parsed[0].strip()

        if nested_value.startswith("[") and nested_value.endswith("]"):
            try:
                nested_parsed = json.loads(nested_value)

                if isinstance(nested_parsed, list):
                    parsed = nested_parsed
            except json.JSONDecodeError:
                pass

    normalized: list[str] = []

    for option in parsed:
        if isinstance(option, str):
            text = option.strip()
        elif option is None:
            text = ""
        else:
            text = str(option).strip()

        if text:
            normalized.append(text)

    return normalized


def normalize_question(row: dict[str, Any]) -> Optional[dict[str, Any]]:
    options = normalize_options(row.get("options"))

    if len(options) != 4:
        return None

    raw_answer_index = row.get("correct_answer_index")

    try:
        answer_index = int(raw_answer_index)
    except (TypeError, ValueError):
        return None

    if answer_index < 0 or answer_index > 3:
        return None

    question_text = str(row.get("question_text") or "").strip()
    skill_type = str(row.get("skill_type") or "").strip()

    if not question_text:
        return None

    if skill_type not in SUPPORTED_SKILLS:
        return None

    return {
        "id": str(row.get("id") or ""),
        "skill_type": skill_type,
        "question_text": question_text,
        "options": options,
        "correct_answer_index": answer_index,
        "explanation": row.get("explanation"),
        "difficulty": int(row.get("difficulty") or 1),
        "created_at": row.get("created_at"),
    }


@app.get("/")
def read_root():
    return {
        "message": "Welcome to Stack Survivors API!",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "supabase_connected": supabase is not None,
    }


@app.post("/api/score")
def submit_score(score: ScoreRequest):
    client = require_supabase()

    try:
        survived_time = max(0, int(score.survival_time))
        level = max(1, int(score.level))
        correct_answers = max(0, int(score.correct_answers))

        total_score = (
            survived_time
            + level * 100
            + correct_answers * 300
        )

        username = score.username.strip() or "Anonymous"

        if score.user_id:
            try:
                profile_response = (
                    client.table("profiles")
                    .select("nickname,email")
                    .eq("id", score.user_id)
                    .maybe_single()
                    .execute()
                )

                profile = profile_response.data

                if profile:
                    username = (
                        profile.get("nickname")
                        or profile.get("email")
                        or username
                    )
            except Exception as profile_error:
                print(
                    "Failed to load profile:",
                    profile_error,
                )

        payload = {
            "user_id": score.user_id,
            "username": username,
            "score": total_score,
            "survived_time": survived_time,
            "level": level,
            "max_level": level,
            "correct_answers": correct_answers,
        }

        try:
            insert_response = (
                client.table("game_records")
                .insert(payload)
                .execute()
            )
        except Exception as insert_error:
            # auth.users/profiles에 없는 user_id가 전달된 경우
            # 비로그인 기록으로 한 번 더 저장
            if (
                score.user_id
                and "game_records_user_id_fkey"
                in str(insert_error)
            ):
                payload["user_id"] = None

                insert_response = (
                    client.table("game_records")
                    .insert(payload)
                    .execute()
                )
            else:
                raise

        inserted_record = None

        if insert_response.data:
            inserted_record = insert_response.data[0]

        return {
            "status": "success",
            "score": total_score,
            "record": inserted_record,
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.get("/api/leaderboard")
def get_leaderboard():
    client = require_supabase()

    try:
        response = (
            client.table("game_records")
            .select("*")
            .order("score", desc=True)
            .order("survived_time", desc=True)
            .limit(10)
            .execute()
        )

        records = response.data or []

        for row in records:
            survived_time = int(
                row.get("survived_time") or 0
            )
            level = int(
                row.get("level")
                or row.get("max_level")
                or 1
            )
            correct_answers = int(
                row.get("correct_answers") or 0
            )

            row["survival_time"] = survived_time

            if row.get("score") is None:
                row["score"] = (
                    survived_time
                    + level * 100
                    + correct_answers * 300
                )

        return {
            "data": records,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.get("/api/questions")
def get_questions(
    language: Optional[str] = Query(default=None),
    skill_type: Optional[str] = Query(default=None),
    limit: int = Query(default=210, ge=1, le=500),
):
    client = require_supabase()

    selected_skill = skill_type or language

    if (
        selected_skill is not None
        and selected_skill not in SUPPORTED_SKILLS
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported skill_type: {selected_skill}. "
                f"Supported values: "
                f"{', '.join(sorted(SUPPORTED_SKILLS))}"
            ),
        )

    try:
        query = (
            client.table("questions")
            .select(
                "id,"
                "skill_type,"
                "question_text,"
                "options,"
                "correct_answer_index,"
                "explanation,"
                "difficulty,"
                "created_at"
            )
        )

        if selected_skill:
            query = query.eq(
                "skill_type",
                selected_skill,
            )

        response = (
            query
            .limit(limit)
            .execute()
        )

        rows = response.data or []
        questions: list[dict[str, Any]] = []
        invalid_question_ids: list[str] = []

        for row in rows:
            normalized = normalize_question(row)

            if normalized is None:
                invalid_question_ids.append(
                    str(row.get("id") or "unknown")
                )
                continue

            questions.append(normalized)

        return {
            "data": questions,
            "count": len(questions),
            "invalid_count": len(invalid_question_ids),
            "invalid_question_ids": invalid_question_ids,
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error