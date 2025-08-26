from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Result(Base):
    __tablename__ = "results"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    analyte_id = Column(Integer, ForeignKey("analytes.id"), nullable=True)  # Может быть NULL если не смаплено
    
    # Исходные данные из документа
    source_label = Column(String, nullable=False)  # Название показателя как в документе
    raw_value = Column(String, nullable=False)  # Исходное значение как строка
    raw_unit = Column(String, nullable=True)  # Исходная единица
    raw_reference_range = Column(String, nullable=True)  # Исходный референс
    
    # Нормализованные данные
    numeric_value = Column(Numeric(15, 6), nullable=True)  # Числовое значение
    normalized_unit = Column(String, nullable=True)  # Приведенная единица
    normalized_reference_min = Column(Numeric(15, 6), nullable=True)
    normalized_reference_max = Column(Numeric(15, 6), nullable=True)
    
    # Флаги и анализ
    is_numeric = Column(Boolean, default=False)
    is_out_of_range = Column(Boolean, nullable=True)
    flag = Column(String, nullable=True)  # H, L, N и т.д.
    is_suspect = Column(Boolean, default=False)  # >10x от референса
    normalized = Column(Boolean, default=False)  # Успешно нормализовано
    
    # Связь с предыдущим результатом для расчета дельт
    previous_result_id = Column(Integer, ForeignKey("results.id"), nullable=True)
    delta_value = Column(Numeric(15, 6), nullable=True)
    delta_percent = Column(Numeric(8, 3), nullable=True)
    
    # Дополнительные метаданные
    lab_comments = Column(Text, nullable=True)
    processing_notes = Column(JSON, nullable=True)  # Заметки о процессе нормализации
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    document = relationship("Document", back_populates="results")
    analyte = relationship("Analyte")