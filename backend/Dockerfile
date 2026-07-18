# 1단계: 의존성 설치 및 빌드 환경 구성
FROM python:3.11-slim AS build

WORKDIR /app

# 시스템 의존성 설치 (필요시)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 파이썬 패키지 설치
COPY backend/requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# 2단계: 실행 환경 구성
FROM python:3.11-slim

WORKDIR /app

# 1단계에서 빌드된 파이썬 패키지 휠 가져오기
COPY --from=build /app/wheels /wheels
COPY --from=build /app/requirements.txt .

RUN pip install --no-cache /wheels/*

# 백엔드 소스코드 복사
COPY backend/src ./src

EXPOSE 8000

ENV TZ=Asia/Seoul
# FastAPI(uvicorn) 실행 (실제 프로젝트 구조에 맞게 src.main:app 등 수정 필요)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
