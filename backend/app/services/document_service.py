from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models.document import Document
from app.models.result import Result
from app.schemas.base import DocumentCreate, DocumentUpdate


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_document(
        self, 
        document_data: DocumentCreate, 
        file_path: str,
        file_size: int,
        mime_type: str,
        user_id: int
    ) -> Document:
        db_document = Document(
            user_id=user_id,
            filename=document_data.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            lab_name=document_data.lab_name,
            report_date=document_data.report_date,
            status="pending"
        )
        self.db.add(db_document)
        self.db.commit()
        self.db.refresh(db_document)
        return db_document
    
    def get_document(self, document_id: int, user_id: int) -> Optional[Document]:
        return self.db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
    
    def get_documents(
        self, 
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[Document]:
        query = self.db.query(Document).filter(Document.user_id == user_id)
        
        if status:
            query = query.filter(Document.status == status)
        
        return query.offset(skip).limit(limit).all()
    
    def update_document(
        self, 
        document_id: int, 
        document_update: DocumentUpdate,
        user_id: int
    ) -> Optional[Document]:
        db_document = self.get_document(document_id, user_id)
        if not db_document:
            return None
        
        update_data = document_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_document, field, value)
        
        self.db.commit()
        self.db.refresh(db_document)
        return db_document
    
    def delete_document(self, document_id: int, user_id: int) -> bool:
        db_document = self.get_document(document_id, user_id)
        if not db_document:
            return False
        
        self.db.delete(db_document)
        self.db.commit()
        return True
    
    def get_documents_with_results_count(
        self, 
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[dict]:
        """Получить документы с подсчетом количества результатов"""
        query = self.db.query(
            Document,
            func.coalesce(func.count(Result.id), 0).label('results_count')
        ).outerjoin(Result).filter(Document.user_id == user_id)
        
        if status:
            query = query.filter(Document.status == status)
        
        query = query.group_by(Document.id).order_by(Document.created_at.desc())
        
        results = query.offset(skip).limit(limit).all()
        
        # Преобразуем в словари для удобства
        documents_with_count = []
        for document, results_count in results:
            doc_dict = {
                'id': document.id,
                'user_id': document.user_id,
                'filename': document.filename,
                'file_path': document.file_path,
                'file_size': document.file_size,
                'mime_type': document.mime_type,
                'status': document.status,
                'error_message': document.error_message,
                'lab_name': document.lab_name,
                'report_date': document.report_date,
                'raw_extracted_data': document.raw_extracted_data,
                'created_at': document.created_at,
                'updated_at': document.updated_at,
                'results_count': results_count
            }
            documents_with_count.append(doc_dict)
        
        return documents_with_count