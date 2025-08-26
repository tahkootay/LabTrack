from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.base import Analyte, AnalyteCreate, AnalyteUpdate, AnalyteMapping
from app.services.analyte_service import AnalyteService

router = APIRouter()


@router.get("/", response_model=List[Analyte])
def get_analytes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    analyte_service = AnalyteService(db)
    analytes = analyte_service.get_analytes(
        skip=skip,
        limit=limit,
        search=search,
        active_only=active_only
    )
    return analytes


@router.get("/{analyte_id}", response_model=Analyte)
def get_analyte(
    analyte_id: int,
    db: Session = Depends(get_db)
):
    analyte_service = AnalyteService(db)
    analyte = analyte_service.get_analyte(analyte_id)
    if not analyte:
        raise HTTPException(status_code=404, detail="Аналит не найден")
    return analyte


@router.post("/", response_model=Analyte)
def create_analyte(
    analyte_data: AnalyteCreate,
    db: Session = Depends(get_db)
):
    analyte_service = AnalyteService(db)
    if analyte_service.get_analyte_by_code(analyte_data.code):
        raise HTTPException(status_code=400, detail="Аналит с таким кодом уже существует")
    return analyte_service.create_analyte(analyte_data)


@router.put("/{analyte_id}", response_model=Analyte)
def update_analyte(
    analyte_id: int,
    analyte_update: AnalyteUpdate,
    db: Session = Depends(get_db)
):
    analyte_service = AnalyteService(db)
    analyte = analyte_service.update_analyte(analyte_id, analyte_update)
    if not analyte:
        raise HTTPException(status_code=404, detail="Аналит не найден")
    return analyte


@router.get("/mappings/search")
def search_mappings(
    source_label: str = Query(..., description="Название показателя из лабораторного отчета"),
    lab_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    analyte_service = AnalyteService(db)
    mappings = analyte_service.find_mappings(source_label, lab_name)
    return {
        "source_label": source_label,
        "suggestions": mappings
    }


@router.post("/mappings/validate")
def validate_mapping(
    source_label: str,
    analyte_id: int,
    lab_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    analyte_service = AnalyteService(db)
    mapping = analyte_service.create_or_update_mapping(
        source_label=source_label,
        analyte_id=analyte_id,
        lab_name=lab_name,
        is_validated=True
    )
    return {"message": "Маппинг подтвержден", "mapping": mapping}