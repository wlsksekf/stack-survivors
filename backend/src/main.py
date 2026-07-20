import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    VITE_SUPABASE_URL: str = ""
    VITE_SUPABASE_ANON_KEY: str = ""
    
    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

settings = Settings()

SUPABASE_URL = settings.VITE_SUPABASE_URL
SUPABASE_KEY = settings.VITE_SUPABASE_ANON_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

app = FastAPI(
    title="Stack Survivors API",
    description="FastAPI Backend for Stack Survivors",
    version="0.1.0"
)

# CORS 설정 (필요에 따라 도메인 수정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 개발 단계에서는 전체 허용, 운영 환경에서는 도메인 명시
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreRequest(BaseModel):
    username: str
    survival_time: float
    level: int
    correct_answers: int
    user_id: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to Stack Survivors API!"}

@app.get("/health")
def health_check():
    return {"status": "ok", "supabase_connected": supabase is not None}

@app.post("/api/score")
def submit_score(score: ScoreRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        survived_time = max(0, int(score.survival_time))
        level = max(1, score.level)
        correct_answers = max(0, score.correct_answers)
        total_score = survived_time + (level * 100) + (correct_answers * 300)
        username = score.username

        if score.user_id:
            try:
                profile = (
                    supabase.table("profiles")
                    .select("nickname,email")
                    .eq("id", score.user_id)
                    .maybe_single()
                    .execute()
                )
                if profile.data:
                    username = profile.data.get("nickname") or profile.data.get("email") or username
            except Exception:
                pass

        payload = {
            "user_id": score.user_id,
            "username": username,
            "score": total_score,
            "survived_time": survived_time,
            "level": level,
            "max_level": level,
            "correct_answers": correct_answers
        }

        try:
            data, count = supabase.table("game_records").insert(payload).execute()
        except Exception as insert_error:
            if score.user_id and "game_records_user_id_fkey" in str(insert_error):
                payload["user_id"] = None
                data, count = supabase.table("game_records").insert(payload).execute()
            else:
                raise insert_error

        return {"status": "success", "score": total_score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaderboard")
def get_leaderboard():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Sort by survived_time descending, then level descending
        response = (
            supabase.table("game_records")
            .select("*")
            .order("score", desc=True)
            .order("survived_time", desc=True)
            .limit(10)
            .execute()
        )
        
        # We need to return survival_time so the frontend handles it properly
        for row in response.data:
            if "survived_time" in row:
                row["survival_time"] = row["survived_time"]
                
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions")
def get_questions(language: str = None, skill_type: str = None):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        query = supabase.table("questions").select("*")
        selected_skill = skill_type or language
        if selected_skill:
            query = query.eq("skill_type", selected_skill)
        response = query.execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
