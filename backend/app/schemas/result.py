from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
from decimal import Decimal


class ResultBase(BaseModel):
    source_label: str
    raw_value: str
    raw_unit: Optional[str] = None
    raw_reference_range: Optional[str] = None
    lab_comments: Optional[str] = None


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
    processing_notes: Optional[Any] = None


class Result(ResultBase):
    id: int
    document_id: int
    analyte_id: Optional[int]
    numeric_value: Optional[Decimal]
    normalized_unit: Optional[str]
    normalized_reference_min: Optional[Decimal]
    normalized_reference_max: Optional[Decimal]
    is_numeric: bool
    is_out_of_range: Optional[bool]
    flag: Optional[str]
    is_suspect: bool
    normalized: bool
    previous_result_id: Optional[int]
    delta_value: Optional[Decimal]
    delta_percent: Optional[Decimal]
    processing_notes: Optional[Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResultWithAnalyte(Result):
    analyte: Optional[Analyte] = None
    
    class Config:
        from_attributes = True