from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from app.models.analyte import Analyte, AnalyteMapping
from app.schemas.analyte import AnalyteCreate, AnalyteUpdate


class AnalyteService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_analytes(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        active_only: bool = True
    ) -> List[Analyte]:
        query = self.db.query(Analyte)
        
        if active_only:
            query = query.filter(Analyte.is_active == True)
        
        if search:
            search_filter = or_(
                Analyte.name.ilike(f"%{search}%"),
                Analyte.code.ilike(f"%{search}%"),
                Analyte.loinc_code.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        return query.offset(skip).limit(limit).all()
    
    def get_analyte(self, analyte_id: int) -> Optional[Analyte]:
        return self.db.query(Analyte).filter(Analyte.id == analyte_id).first()
    
    def get_analyte_by_code(self, code: str) -> Optional[Analyte]:
        return self.db.query(Analyte).filter(Analyte.code == code).first()
    
    def create_analyte(self, analyte_data: AnalyteCreate) -> Analyte:
        db_analyte = Analyte(**analyte_data.model_dump())
        self.db.add(db_analyte)
        self.db.commit()
        self.db.refresh(db_analyte)
        return db_analyte
    
    def update_analyte(self, analyte_id: int, analyte_update: AnalyteUpdate) -> Optional[Analyte]:
        db_analyte = self.get_analyte(analyte_id)
        if not db_analyte:
            return None
        
        update_data = analyte_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_analyte, field, value)
        
        self.db.commit()
        self.db.refresh(db_analyte)
        return db_analyte
    
    def find_mappings(self, source_label: str, lab_name: Optional[str] = None) -> List[dict]:
        # Поиск точных совпадений
        exact_query = self.db.query(AnalyteMapping, Analyte).join(
            Analyte, AnalyteMapping.analyte_id == Analyte.id
        ).filter(
            func.lower(AnalyteMapping.source_label) == source_label.lower()
        )
        
        if lab_name:
            exact_query = exact_query.filter(AnalyteMapping.lab_name == lab_name)
        
        exact_matches = exact_query.all()
        
        suggestions = []
        for mapping, analyte in exact_matches:
            suggestions.append({
                'analyte_id': analyte.id,
                'analyte_name': analyte.name,
                'analyte_code': analyte.code,
                'confidence_score': float(mapping.confidence_score),
                'is_validated': mapping.is_validated,
                'match_type': 'exact'
            })
        
        # Если точных совпадений нет, ищем частичные
        if not suggestions:
            partial_query = self.db.query(Analyte).filter(
                or_(
                    Analyte.name.ilike(f"%{source_label}%"),
                    func.similarity(Analyte.name, source_label) > 0.3
                )
            ).limit(5)
            
            for analyte in partial_query.all():
                suggestions.append({
                    'analyte_id': analyte.id,
                    'analyte_name': analyte.name,
                    'analyte_code': analyte.code,
                    'confidence_score': 0.7,  # Базовая уверенность для частичных совпадений
                    'is_validated': False,
                    'match_type': 'partial'
                })
        
        return sorted(suggestions, key=lambda x: x['confidence_score'], reverse=True)
    
    def create_or_update_mapping(
        self,
        source_label: str,
        analyte_id: int,
        lab_name: Optional[str] = None,
        confidence_score: float = 1.0,
        is_validated: bool = False
    ) -> AnalyteMapping:
        # Проверяем существующий маппинг
        existing_mapping = self.db.query(AnalyteMapping).filter(
            AnalyteMapping.source_label == source_label,
            AnalyteMapping.analyte_id == analyte_id,
            AnalyteMapping.lab_name == lab_name
        ).first()
        
        if existing_mapping:
            existing_mapping.confidence_score = confidence_score
            existing_mapping.is_validated = is_validated
            self.db.commit()
            self.db.refresh(existing_mapping)
            return existing_mapping
        else:
            new_mapping = AnalyteMapping(
                source_label=source_label,
                analyte_id=analyte_id,
                lab_name=lab_name,
                confidence_score=confidence_score,
                is_validated=is_validated
            )
            self.db.add(new_mapping)
            self.db.commit()
            self.db.refresh(new_mapping)
            return new_mapping