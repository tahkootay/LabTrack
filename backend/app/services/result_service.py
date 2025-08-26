from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, or_, func, distinct
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.models.result import Result
from app.models.document import Document
from app.models.analyte import Analyte
from app.schemas.result import ResultCreate, ResultUpdate


class ResultService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_results(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        analyte_id: Optional[int] = None,
        document_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        out_of_range: Optional[bool] = None,
        suspect: Optional[bool] = None
    ) -> List[Result]:
        query = self.db.query(Result).options(
            joinedload(Result.analyte),
            joinedload(Result.document)
        ).join(Document).filter(Document.user_id == user_id)
        
        if analyte_id:
            query = query.filter(Result.analyte_id == analyte_id)
        
        if document_id:
            query = query.filter(Result.document_id == document_id)
        
        if date_from or date_to:
            if date_from:
                query = query.filter(Result.created_at >= date_from)
            if date_to:
                query = query.filter(Result.created_at <= date_to + timedelta(days=1))
        
        if out_of_range is not None:
            query = query.filter(Result.is_out_of_range == out_of_range)
        
        if suspect is not None:
            query = query.filter(Result.is_suspect == suspect)
        
        return query.order_by(desc(Result.created_at)).offset(skip).limit(limit).all()
    
    def get_result(self, result_id: int, user_id: int) -> Optional[Result]:
        return self.db.query(Result).options(
            joinedload(Result.analyte),
            joinedload(Result.document)
        ).join(Document).filter(
            Result.id == result_id,
            Document.user_id == user_id
        ).first()
    
    def update_result(
        self, 
        result_id: int, 
        result_update: ResultUpdate,
        user_id: int
    ) -> Optional[Result]:
        db_result = self.get_result(result_id, user_id)
        if not db_result:
            return None
        
        update_data = result_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_result, field, value)
        
        self.db.commit()
        self.db.refresh(db_result)
        return db_result
    
    def get_analyte_history(
        self,
        analyte_id: int,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Result]:
        return self.db.query(Result).options(
            joinedload(Result.analyte),
            joinedload(Result.document)
        ).join(Document).filter(
            Result.analyte_id == analyte_id,
            Document.user_id == user_id
        ).order_by(desc(Result.created_at)).offset(skip).limit(limit).all()
    
    def get_source_label_history(
        self,
        source_label: str,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Result]:
        return self.db.query(Result).options(
            joinedload(Result.analyte),
            joinedload(Result.document)
        ).join(Document).filter(
            Result.source_label == source_label,
            Document.user_id == user_id
        ).order_by(desc(Result.created_at)).offset(skip).limit(limit).all()
    
    def get_trends_summary(
        self,
        user_id: int,
        analyte_ids: List[int] = None,
        days: int = 30
    ) -> dict:
        cutoff_date = datetime.now() - timedelta(days=days)
        
        query = self.db.query(Result).join(Document).filter(
            Document.user_id == user_id,
            Result.created_at >= cutoff_date,
            Result.normalized == True
        )
        
        if analyte_ids:
            query = query.filter(Result.analyte_id.in_(analyte_ids))
        
        results = query.all()
        
        trends = {}
        for result in results:
            if result.analyte_id not in trends:
                trends[result.analyte_id] = {
                    'analyte_name': result.analyte.name if result.analyte else 'Unknown',
                    'values': [],
                    'out_of_range_count': 0,
                    'suspect_count': 0
                }
            
            trends[result.analyte_id]['values'].append({
                'date': result.created_at,
                'value': float(result.numeric_value) if result.numeric_value else None,
                'unit': result.normalized_unit,
                'is_out_of_range': result.is_out_of_range
            })
            
            if result.is_out_of_range:
                trends[result.analyte_id]['out_of_range_count'] += 1
            if result.is_suspect:
                trends[result.analyte_id]['suspect_count'] += 1
        
        return trends
    
    def get_results_summary(
        self,
        user_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None,
        lab_name: Optional[str] = None,
        out_of_range_only: Optional[bool] = None
    ) -> List[dict]:
        """Получить сводку последних результатов по показателям"""
        
        # Подзапрос для получения последних результатов по каждому показателю
        # Используем source_label как группировку, так как analyte_id может быть None
        latest_subquery = self.db.query(
            Result.source_label,
            func.max(Result.created_at).label('latest_date')
        ).join(Document).filter(
            Document.user_id == user_id
        )
        
        # Применяем фильтры даты
        if date_from:
            latest_subquery = latest_subquery.filter(Result.created_at >= date_from)
        if date_to:
            latest_subquery = latest_subquery.filter(Result.created_at <= date_to + timedelta(days=1))
            
        # Применяем фильтр лаборатории
        if lab_name:
            latest_subquery = latest_subquery.filter(Document.lab_name.ilike(f"%{lab_name}%"))
        
        latest_subquery = latest_subquery.group_by(Result.source_label).subquery()
        
        # Основной запрос для получения данных
        query = self.db.query(Result).options(
            joinedload(Result.analyte),
            joinedload(Result.document)
        ).join(Document).join(
            latest_subquery,
            and_(
                Result.source_label == latest_subquery.c.source_label,
                Result.created_at == latest_subquery.c.latest_date
            )
        ).filter(Document.user_id == user_id)
        
        # Применяем поиск по названию показателя
        if search:
            query = query.filter(Result.source_label.ilike(f"%{search}%"))
        
        # Фильтр только вне нормы
        if out_of_range_only:
            query = query.filter(Result.is_out_of_range == True)
        
        results = query.order_by(desc(Result.created_at)).all()
        
        # Формируем ответ
        summary = []
        for result in results:
            # Определяем флаг
            flag = "норма"
            if result.is_suspect:
                flag = "аномалия"
            elif result.flag and result.flag.upper() in ['H', 'HIGH', 'HH']:
                flag = "↑"
            elif result.flag and result.flag.upper() in ['L', 'LOW', 'LL']:
                flag = "↓"
            elif result.is_out_of_range:
                if result.numeric_value and result.normalized_reference_max:
                    flag = "↑" if float(result.numeric_value) > float(result.normalized_reference_max) else "↓"
                else:
                    flag = "↑/↓"
            
            # Форматируем референс
            reference = ""
            if result.normalized_reference_min and result.normalized_reference_max:
                reference = f"{result.normalized_reference_min}-{result.normalized_reference_max}"
            elif result.raw_reference_range:
                reference = result.raw_reference_range
            
            # Определяем is_out_of_range на основе flag, если не задано
            is_out_of_range = result.is_out_of_range
            if is_out_of_range is None and result.flag:
                is_out_of_range = result.flag.upper() in ['H', 'HIGH', 'L', 'LOW', 'HH', 'LL']
            
            summary.append({
                "analyte_id": result.analyte_id or f"source_{hash(result.source_label)}",  # Используем хеш как ID для группировки
                "analyte_name": result.analyte.name if result.analyte else result.source_label,
                "source_label": result.source_label,  # Добавляем source_label для навигации
                "last_value": str(result.numeric_value) if result.numeric_value else result.raw_value,
                "unit": result.normalized_unit or result.raw_unit or "",
                "reference": reference,
                "flag": flag,
                "date": result.created_at,
                "lab_name": result.document.lab_name,
                "is_out_of_range": is_out_of_range or False,
                "is_suspect": result.is_suspect
            })
        
        return summary
    
    def create_manual_result(self, result_data: ResultCreate, user_id: int) -> Result:
        # TODO: Проверить что document принадлежит пользователю
        db_result = Result(
            **result_data.model_dump(),
            normalized=False  # Будет нормализовано позже
        )
        self.db.add(db_result)
        self.db.commit()
        self.db.refresh(db_result)
        
        # TODO: Запустить нормализацию через Celery
        
        return db_result