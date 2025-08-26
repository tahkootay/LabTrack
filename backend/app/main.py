from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import documents, results, analytes
from app.core.config import settings

app = FastAPI(
    title="LabTrack API",
    description="Медицинский трекер анализов - API для загрузки, обработки и анализа медицинских документов",
    version="1.0.0"
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API роуты
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(results.router, prefix="/api/v1/results", tags=["results"])
app.include_router(analytes.router, prefix="/api/v1/analytes", tags=["analytes"])


@app.get("/")
async def root():
    return {"message": "LabTrack API v1.0.0", "status": "healthy"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.environment}