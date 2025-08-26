from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from app.schemas import (
    User, UserCreate, UserUpdate,
    Document, DocumentCreate, DocumentUpdate, DocumentWithResults,
    Analyte, AnalyteCreate, AnalyteUpdate,
    Result, ResultCreate, ResultUpdate, ResultWithAnalyte
)

# Временная заглушка вместо реальной БД
def get_db():
    # Пока используем заглушку
    yield None

app = FastAPI(
    title="LabTrack API",
    description="API для систематизации медицинских анализов",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "LabTrack API v1.0", 
        "status": "running",
        "features": [
            "Загрузка медицинских документов",
            "Автоматическое извлечение данных с помощью LLM",
            "Нормализация показателей",
            "Анализ динамики результатов"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/info")
async def app_info():
    return {
        "name": "LabTrack",
        "version": "1.0.0",
        "description": "Безопасный сервис для систематизации медицинских анализов",
        "endpoints": [
            "/users - управление пользователями",
            "/documents - управление документами", 
            "/results - результаты анализов",
            "/analytes - справочник аналитов"
        ]
    }

# User endpoints
@app.get("/users", response_model=List[User])
def get_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    # Пока возвращаем моковые данные
    return [{"id": 1, "email": None, "is_active": True, "created_at": "2024-01-01T00:00:00"}]

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    if user_id == 1:
        return {"id": 1, "email": None, "is_active": True, "created_at": "2024-01-01T00:00:00"}
    raise HTTPException(status_code=404, detail="User not found")

# Document endpoints
@app.get("/documents", response_model=List[Document])
def get_documents(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    # Пока возвращаем моковые данные
    return []

@app.get("/documents/{document_id}", response_model=DocumentWithResults)
def get_document(document_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=404, detail="Document not found")

@app.post("/documents", response_model=Document)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    # Пока возвращаем моковые данные
    return {
        "id": 1,
        "user_id": document.user_id,
        "filename": document.filename,
        "file_path": f"/uploads/{document.filename}",
        "status": "pending",
        "created_at": "2024-01-01T00:00:00"
    }

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "size": file.size,
        "content_type": file.content_type
    }

# Result endpoints
@app.get("/results", response_model=List[Result])
def get_results(
    document_id: Optional[int] = None,
    analyte_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 50,
    db: Session = Depends(get_db)
):
    # Пока возвращаем моковые данные
    return []

@app.get("/results/{result_id}", response_model=ResultWithAnalyte)
def get_result(result_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=404, detail="Result not found")

# Analyte endpoints
@app.get("/analytes", response_model=List[Analyte])
def get_analytes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Возвращаем базовые аналиты
    return [
        {
            "id": 1,
            "code": "glucose",
            "name": "Глюкоза",
            "default_unit": "ммоль/л",
            "reference_ranges": {"normal": {"min": 3.9, "max": 5.5}}
        },
        {
            "id": 2,
            "code": "hemoglobin", 
            "name": "Гемоглобин",
            "default_unit": "г/л",
            "reference_ranges": {
                "male": {"min": 130, "max": 160},
                "female": {"min": 120, "max": 150}
            }
        },
        {
            "id": 3,
            "code": "cholesterol",
            "name": "Холестерин общий",
            "default_unit": "ммоль/л", 
            "reference_ranges": {"normal": {"max": 5.2}}
        }
    ]

@app.get("/analytes/{analyte_id}", response_model=Analyte)
def get_analyte(analyte_id: int, db: Session = Depends(get_db)):
    analytes = {
        1: {
            "id": 1,
            "code": "glucose",
            "name": "Глюкоза",
            "default_unit": "ммоль/л",
            "reference_ranges": {"normal": {"min": 3.9, "max": 5.5}}
        }
    }
    if analyte_id in analytes:
        return analytes[analyte_id]
    raise HTTPException(status_code=404, detail="Analyte not found")

@app.post("/analytes", response_model=Analyte)
def create_analyte(analyte: AnalyteCreate, db: Session = Depends(get_db)):
    return {
        "id": 999,
        **analyte.dict()
    }

# Stats endpoint
@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "total_documents": 0,
        "total_results": 0,
        "total_analytes": 3,
        "processed_documents": 0,
        "pending_documents": 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)