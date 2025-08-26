"""
CRUD операции для LabTrack
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import User, Document, Analyte, Result, AnalyteMapping
from app.schemas.base import (
    UserCreate, UserUpdate,
    DocumentCreate, DocumentUpdate, 
    AnalyteCreate, AnalyteUpdate,
    ResultCreate, ResultUpdate
)

# User CRUD
def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if db_user:
        for key, value in user.model_dump(exclude_unset=True).items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

# Document CRUD
def get_document(db: Session, document_id: int) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id).first()

def get_documents(db: Session, user_id: int = 1, skip: int = 0, limit: int = 100) -> List[Document]:
    return (db.query(Document)
            .filter(Document.user_id == user_id)
            .order_by(desc(Document.created_at))
            .offset(skip)
            .limit(limit)
            .all())

def create_document(db: Session, document: DocumentCreate) -> Document:
    db_document = Document(**document.model_dump())
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def update_document(db: Session, document_id: int, document: DocumentUpdate) -> Optional[Document]:
    db_document = get_document(db, document_id)
    if db_document:
        for key, value in document.model_dump(exclude_unset=True).items():
            setattr(db_document, key, value)
        db.commit()
        db.refresh(db_document)
    return db_document

# Analyte CRUD
def get_analyte(db: Session, analyte_id: int) -> Optional[Analyte]:
    return db.query(Analyte).filter(Analyte.id == analyte_id).first()

def get_analyte_by_code(db: Session, code: str) -> Optional[Analyte]:
    return db.query(Analyte).filter(Analyte.code == code).first()

def get_analytes(db: Session, skip: int = 0, limit: int = 100) -> List[Analyte]:
    return (db.query(Analyte)
            .filter(Analyte.is_active == True)
            .offset(skip)
            .limit(limit)
            .all())

def create_analyte(db: Session, analyte: AnalyteCreate) -> Analyte:
    db_analyte = Analyte(**analyte.model_dump())
    db.add(db_analyte)
    db.commit()
    db.refresh(db_analyte)
    return db_analyte

def update_analyte(db: Session, analyte_id: int, analyte: AnalyteUpdate) -> Optional[Analyte]:
    db_analyte = get_analyte(db, analyte_id)
    if db_analyte:
        for key, value in analyte.model_dump(exclude_unset=True).items():
            setattr(db_analyte, key, value)
        db.commit()
        db.refresh(db_analyte)
    return db_analyte

# Result CRUD
def get_result(db: Session, result_id: int) -> Optional[Result]:
    return db.query(Result).filter(Result.id == result_id).first()

def get_results(db: Session, 
                document_id: Optional[int] = None,
                analyte_id: Optional[int] = None,
                skip: int = 0, 
                limit: int = 100) -> List[Result]:
    query = db.query(Result)
    
    if document_id:
        query = query.filter(Result.document_id == document_id)
    if analyte_id:
        query = query.filter(Result.analyte_id == analyte_id)
    
    return (query.order_by(desc(Result.created_at))
            .offset(skip)
            .limit(limit)
            .all())

def create_result(db: Session, result: ResultCreate) -> Result:
    db_result = Result(**result.model_dump())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def update_result(db: Session, result_id: int, result: ResultUpdate) -> Optional[Result]:
    db_result = get_result(db, result_id)
    if db_result:
        for key, value in result.model_dump(exclude_unset=True).items():
            setattr(db_result, key, value)
        db.commit()
        db.refresh(db_result)
    return db_result

# Statistics
def get_stats(db: Session, user_id: int = 1) -> dict:
    return {
        "total_documents": db.query(Document).filter(Document.user_id == user_id).count(),
        "total_results": db.query(Result).join(Document).filter(Document.user_id == user_id).count(),
        "total_analytes": db.query(Analyte).filter(Analyte.is_active == True).count(),
        "processed_documents": db.query(Document).filter(
            Document.user_id == user_id,
            Document.status == "completed"
        ).count(),
        "pending_documents": db.query(Document).filter(
            Document.user_id == user_id,
            Document.status == "pending"
        ).count()
    }