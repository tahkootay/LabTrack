from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, Any
from decimal import Decimal


class AnalyteBase(BaseModel):
    code: str
    loinc_code: Optional[str] = None
    name: str
    description: Optional[str] = None
    default_unit: Optional[str] = None
    unit_category: Optional[str] = None
    reference_ranges: Optional[Any] = None


class AnalyteCreate(AnalyteBase):
    pass


class AnalyteUpdate(BaseModel):
    code: Optional[str] = None
    loinc_code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    default_unit: Optional[str] = None
    unit_category: Optional[str] = None
    reference_ranges: Optional[Any] = None
    is_active: Optional[bool] = None


class Analyte(AnalyteBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True


class AnalyteMappingBase(BaseModel):
    source_label: str
    analyte_id: int
    lab_name: Optional[str] = None
    confidence_score: Decimal = Decimal("1.0")


class AnalyteMappingCreate(AnalyteMappingBase):
    pass


class AnalyteMappingUpdate(BaseModel):
    source_label: Optional[str] = None
    analyte_id: Optional[int] = None
    lab_name: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    is_validated: Optional[bool] = None


class AnalyteMapping(AnalyteMappingBase):
    id: int
    is_validated: bool
    
    class Config:
        from_attributes = True