from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, Numeric
from app.db.database import Base


class Analyte(Base):
    __tablename__ = "analytes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)  # Внутренний код
    loinc_code = Column(String, nullable=True, index=True)  # LOINC код если есть
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Дефолтные единицы измерения
    default_unit = Column(String, nullable=True)
    unit_category = Column(String, nullable=True)  # concentration, count, ratio и т.д.
    
    # Дефолтные референсные значения
    reference_ranges = Column(JSON, nullable=True)  # Структура с диапазонами по полу/возрасту
    
    is_active = Column(Boolean, default=True)


class AnalyteMapping(Base):
    __tablename__ = "analyte_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    source_label = Column(String, nullable=False, index=True)  # Название из лабораторного отчета
    analyte_id = Column(Integer, nullable=False, index=True)
    lab_name = Column(String, nullable=True)  # Специфично для лаборатории
    confidence_score = Column(Numeric(3, 2), default=1.0)  # Уверенность в маппинге
    is_validated = Column(Boolean, default=False)  # Проверено человеком