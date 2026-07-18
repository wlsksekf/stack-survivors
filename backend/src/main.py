from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
def read_root():
    return {"message": "Welcome to Stack Survivors API!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
