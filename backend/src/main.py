import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from typing import List

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
        data, count = supabase.table("game_records").insert({
            "username": score.username,
            "survival_time": score.survival_time,
            "level": score.level,
            "correct_answers": score.correct_answers
        }).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leaderboard")
def get_leaderboard():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Sort by survival_time descending, then level descending
        response = supabase.table("game_records").select("*").order("survival_time", desc=True).limit(10).execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions")
def get_questions(language: str = None):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        query = supabase.table("questions").select("*")
        if language:
            query = query.eq("language", language)
        response = query.execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
