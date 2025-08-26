from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, List


class DocumentBase(BaseModel):
    filename: str
    lab_name: Optional[str] = None
    report_date: Optional[datetime] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    error_message: Optional[str] = None
    lab_name: Optional[str] = None
    report_date: Optional[datetime] = None
    raw_extracted_data: Optional[Any] = None


class Document(DocumentBase):
    id: int
    user_id: int
    file_path: str
    file_size: Optional[int]
    mime_type: Optional[str]
    status: str
    error_message: Optional[str]
    raw_extracted_data: Optional[Any]
    created_at: datetime
    updated_at: Optional[datetime]
    results: List[Result] = []
    
    class Config:
        from_attributes = True