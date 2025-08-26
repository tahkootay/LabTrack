from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)  # Дефолтный пользователь для v1
    
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Путь в S3
    file_size = Column(Integer)
    mime_type = Column(String)
    
    status = Column(String, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    # Метаданные извлеченные LLM
    lab_name = Column(String, nullable=True)
    report_date = Column(DateTime(timezone=True), nullable=True)
    raw_extracted_data = Column(JSON, nullable=True)  # Сырые данные от LLM
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    results = relationship("Result", back_populates="document")