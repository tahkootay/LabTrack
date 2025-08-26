# Используем упрощенные схемы без forward references
from app.schemas.base import (
    User, UserCreate, UserUpdate,
    Document, DocumentCreate, DocumentUpdate, DocumentWithResults,
    Analyte, AnalyteCreate, AnalyteUpdate, AnalyteMapping, AnalyteMappingCreate,
    Result, ResultCreate, ResultUpdate, ResultWithAnalyte
)

__all__ = [
    "User", "UserCreate", "UserUpdate",
    "Document", "DocumentCreate", "DocumentUpdate", "DocumentWithResults",
    "Analyte", "AnalyteCreate", "AnalyteUpdate",
    "AnalyteMapping", "AnalyteMappingCreate",
    "Result", "ResultCreate", "ResultUpdate", "ResultWithAnalyte"
]