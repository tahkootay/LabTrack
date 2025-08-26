from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.db.database import get_db
from app.api.deps import get_current_user_id
from app.schemas.base import Result, ResultCreate, ResultUpdate, ResultWithAnalyte
from app.services.result_service import ResultService

router = APIRouter()


@router.get("/", response_model=List[ResultWithAnalyte])
def get_results(
    skip: int = 0,
    limit: int = 100,
    analyte_id: Optional[int] = None,
    document_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    out_of_range: Optional[bool] = None,
    suspect: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    result_service = ResultService(db)
    results = result_service.get_results(
        user_id=current_user_id,
        skip=skip,
        limit=limit,
        analyte_id=analyte_id,
        document_id=document_id,
        date_from=date_from,
        date_to=date_to,
        out_of_range=out_of_range,
        suspect=suspect
    )
    return results


@router.get("/summary")
def get_results_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    lab_name: Optional[str] = None,
    out_of_range_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Получить сводку последних результатов для главного экрана"""
    result_service = ResultService(db)
    summary = result_service.get_results_summary(
        user_id=current_user_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        lab_name=lab_name,
        out_of_range_only=out_of_range_only
    )
    return summary


@router.get("/analyte/{analyte_id}/history", response_model=List[ResultWithAnalyte])
def get_analyte_history(
    analyte_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    result_service = ResultService(db)
    results = result_service.get_analyte_history(
        analyte_id=analyte_id,
        user_id=current_user_id,
        skip=skip,
        limit=limit
    )
    return results


@router.get("/source-label/{source_label}/history", response_model=List[ResultWithAnalyte])
def get_source_label_history(
    source_label: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    result_service = ResultService(db)
    results = result_service.get_source_label_history(
        source_label=source_label,
        user_id=current_user_id,
        skip=skip,
        limit=limit
    )
    return results


@router.get("/{result_id}", response_model=ResultWithAnalyte)
def get_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    result_service = ResultService(db)
    result = result_service.get_result(result_id, current_user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Результат не найден")
    return result


@router.put("/{result_id}", response_model=ResultWithAnalyte)
def update_result(
    result_id: int,
    result_update: ResultUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    result_service = ResultService(db)
    result = result_service.update_result(result_id, result_update, current_user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Результат не найден")
    return result


@router.get("/trends/summary")
def get_trends_summary(
    analyte_ids: List[int] = Query([]),
    days: int = 30,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    result_service = ResultService(db)
    trends = result_service.get_trends_summary(
        user_id=current_user_id,
        analyte_ids=analyte_ids,
        days=days
    )
    return trends


@router.post("/manual", response_model=ResultWithAnalyte)
def create_manual_result(
    result_data: ResultCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    result_service = ResultService(db)
    result = result_service.create_manual_result(result_data, current_user_id)
    return result