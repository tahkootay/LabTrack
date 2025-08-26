from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, List, Dict
from decimal import Decimal


# Базовые схемы без forward references
class UserBase(BaseModel):
    email: Optional[str] = None
    is_active: bool = True


class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None


# Схемы для аналитов
class AnalyteBase(BaseModel):
    code: str
    loinc_code: Optional[str] = None
    name: str
    description: Optional[str] = None
    default_unit: Optional[str] = None
    category: Optional[str] = None
    reference_ranges: Optional[Dict[str, Any]] = None


class Analyte(AnalyteBase):
    id: int
    
    class Config:
        from_attributes = True


class AnalyteCreate(AnalyteBase):
    pass


class AnalyteUpdate(BaseModel):
    loinc_code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    default_unit: Optional[str] = None
    category: Optional[str] = None
    reference_ranges: Optional[Dict[str, Any]] = None


# Схемы для маппинга аналитов
class AnalyteMappingBase(BaseModel):
    analyte_id: int
    source_label: str
    lab_name: Optional[str] = None
    confidence: Optional[float] = None


class AnalyteMapping(AnalyteMappingBase):
    id: int
    
    class Config:
        from_attributes = True


class AnalyteMappingCreate(AnalyteMappingBase):
    pass


# Схемы документов (без связи с Results)
class DocumentBase(BaseModel):
    filename: str
    lab_name: Optional[str] = None
    report_date: Optional[datetime] = None


class Document(DocumentBase):
    id: int
    user_id: int
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    status: str = "pending"
    error_message: Optional[str] = None
    raw_extracted_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DocumentCreate(DocumentBase):
    user_id: int = 1  # По умолчанию для v1
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    error_message: Optional[str] = None
    lab_name: Optional[str] = None
    report_date: Optional[datetime] = None
    raw_extracted_data: Optional[Dict[str, Any]] = None


# Схемы результатов (без связи с Documents)
class ResultBase(BaseModel):
    source_label: str
    raw_value: str
    raw_unit: Optional[str] = None
    raw_reference_range: Optional[str] = None
    lab_comments: Optional[str] = None


class Result(ResultBase):
    id: int
    document_id: int
    analyte_id: Optional[int] = None
    numeric_value: Optional[Decimal] = None
    normalized_unit: Optional[str] = None
    normalized_reference_min: Optional[Decimal] = None
    normalized_reference_max: Optional[Decimal] = None
    is_numeric: bool = False
    is_out_of_range: Optional[bool] = None
    flag: Optional[str] = None
    is_suspect: bool = False
    normalized: bool = False
    previous_result_id: Optional[int] = None
    delta_value: Optional[Decimal] = None
    delta_percent: Optional[Decimal] = None
    processing_notes: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResultCreate(ResultBase):
    document_id: int
    analyte_id: Optional[int] = None


class ResultUpdate(BaseModel):
    source_label: Optional[str] = None
    raw_value: Optional[str] = None
    raw_unit: Optional[str] = None
    raw_reference_range: Optional[str] = None
    numeric_value: Optional[Decimal] = None
    normalized_unit: Optional[str] = None
    normalized_reference_min: Optional[Decimal] = None
    normalized_reference_max: Optional[Decimal] = None
    is_numeric: Optional[bool] = None
    is_out_of_range: Optional[bool] = None
    flag: Optional[str] = None
    is_suspect: Optional[bool] = None
    normalized: Optional[bool] = None
    lab_comments: Optional[str] = None
    processing_notes: Optional[Dict[str, Any]] = None


# Схемы с дополнительными данными (без forward references)
class ResultWithAnalyte(Result):
    analyte: Optional[Analyte] = None


class DocumentWithResults(Document):
    results: List[Result] = []


class DocumentSummary(Document):
    results_count: int = 0