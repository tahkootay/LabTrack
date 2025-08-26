from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.base import (
    User, UserCreate, UserUpdate,
    Document, DocumentCreate, DocumentUpdate, DocumentWithResults,
    Analyte, AnalyteCreate, AnalyteUpdate,
    Result, ResultCreate, ResultUpdate, ResultWithAnalyte
)
import app.crud as crud

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
    return crud.get_users(db, skip=skip, limit=limit)

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Document endpoints
@app.get("/documents", response_model=List[Document])
def get_documents(skip: int = 0, limit: int = 10, user_id: int = 1, db: Session = Depends(get_db)):
    return crud.get_documents(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/documents/{document_id}", response_model=Document)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = crud.get_document(db, document_id=document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.post("/documents", response_model=Document)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    return crud.create_document(db, document=document)

@app.put("/documents/{document_id}", response_model=Document)
def update_document(document_id: int, document: DocumentUpdate, db: Session = Depends(get_db)):
    updated_document = crud.update_document(db, document_id=document_id, document=document)
    if not updated_document:
        raise HTTPException(status_code=404, detail="Document not found")
    return updated_document

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Пока просто создаем запись о документе
    document = DocumentCreate(
        user_id=1,
        filename=file.filename,
        file_path=f"/uploads/{file.filename}",  # Временно
        file_size=file.size,
        mime_type=file.content_type
    )
    created_document = crud.create_document(db, document)
    
    return {
        "message": "File uploaded successfully",
        "document_id": created_document.id,
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
    return crud.get_results(db, document_id=document_id, analyte_id=analyte_id, skip=skip, limit=limit)

@app.get("/results/{result_id}", response_model=Result)
def get_result(result_id: int, db: Session = Depends(get_db)):
    result = crud.get_result(db, result_id=result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result

@app.post("/results", response_model=Result)
def create_result(result: ResultCreate, db: Session = Depends(get_db)):
    return crud.create_result(db, result=result)

# Analyte endpoints
@app.get("/analytes", response_model=List[Analyte])
def get_analytes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_analytes(db, skip=skip, limit=limit)

@app.get("/analytes/{analyte_id}", response_model=Analyte)
def get_analyte(analyte_id: int, db: Session = Depends(get_db)):
    analyte = crud.get_analyte(db, analyte_id=analyte_id)
    if not analyte:
        raise HTTPException(status_code=404, detail="Analyte not found")
    return analyte

@app.get("/analytes/code/{code}", response_model=Analyte)
def get_analyte_by_code(code: str, db: Session = Depends(get_db)):
    analyte = crud.get_analyte_by_code(db, code=code)
    if not analyte:
        raise HTTPException(status_code=404, detail="Analyte not found")
    return analyte

@app.post("/analytes", response_model=Analyte)
def create_analyte(analyte: AnalyteCreate, db: Session = Depends(get_db)):
    # Проверяем, что код уникален
    existing = crud.get_analyte_by_code(db, code=analyte.code)
    if existing:
        raise HTTPException(status_code=400, detail="Analyte with this code already exists")
    return crud.create_analyte(db, analyte=analyte)

# Stats endpoint
@app.get("/stats")
def get_stats(user_id: int = 1, db: Session = Depends(get_db)):
    return crud.get_stats(db, user_id=user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)