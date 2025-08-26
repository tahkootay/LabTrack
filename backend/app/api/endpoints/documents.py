from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.api.deps import get_current_user_id
from app.models.document import Document
from app.schemas.base import DocumentCreate, DocumentUpdate, Document as DocumentSchema, DocumentWithResults
from app.services.document_service import DocumentService
from app.services.file_service import FileService
from app.core.tasks import process_document, reprocess_document as reprocess_task

router = APIRouter()


@router.post("/upload", response_model=DocumentSchema)
async def upload_document(
    file: UploadFile = File(...),
    lab_name: Optional[str] = Form(None),
    report_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    file_service = FileService()
    document_service = DocumentService(db)
    
    # Валидация файла
    if not file_service.validate_file(file):
        raise HTTPException(status_code=400, detail="Недопустимый тип файла")
    
    # Сохранение файла в S3
    file_path = await file_service.save_file(file, current_user_id)
    
    # Создание записи в БД
    document_data = DocumentCreate(
        filename=file.filename,
        lab_name=lab_name,
        report_date=report_date
    )
    
    document = document_service.create_document(
        document_data, 
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type,
        user_id=current_user_id
    )
    
    # Запуск обработки в фоне
    process_document.delay(document.id)
    
    return document


@router.get("/{document_id}", response_model=DocumentSchema)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    document_service = DocumentService(db)
    document = document_service.get_document(document_id, current_user_id)
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return document


@router.get("/", response_model=List[dict])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    with_results_count: bool = True,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    document_service = DocumentService(db)
    
    if with_results_count:
        documents = document_service.get_documents_with_results_count(
            user_id=current_user_id,
            skip=skip,
            limit=limit,
            status=status
        )
        return documents
    else:
        documents = document_service.get_documents(
            user_id=current_user_id,
            skip=skip,
            limit=limit,
            status=status
        )
        return documents


@router.put("/{document_id}", response_model=DocumentSchema)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    document_service = DocumentService(db)
    document = document_service.update_document(document_id, document_update, current_user_id)
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return document


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    document_service = DocumentService(db)
    if not document_service.delete_document(document_id, current_user_id):
        raise HTTPException(status_code=404, detail="Документ не найден")
    return {"message": "Документ удален"}


@router.post("/{document_id}/reprocess")
def reprocess_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    document_service = DocumentService(db)
    document = document_service.get_document(document_id, current_user_id)
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    # Запуск повторной обработки через Celery
    reprocess_task.delay(document_id)
    
    return {"message": "Повторная обработка запущена"}