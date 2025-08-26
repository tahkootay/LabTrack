import asyncio
from celery import current_task
from celery.exceptions import Retry
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
from typing import List, Dict, Any
from app.core.celery import celery_app
from app.core.config import settings
from app.models.document import Document
from app.models.result import Result
from app.services.llm_service import LLMExtractionService
from app.services.normalization_service import NormalizationService
from app.services.document_service import DocumentService


# Создание сессии БД для задач
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@celery_app.task(bind=True, max_retries=3)
def process_document(self, document_id: int):
    """
    Основная задача обработки документа:
    1. Извлечение данных через LLM
    2. Создание результатов в БД
    3. Запуск нормализации
    """
    db = SessionLocal()
    try:
        # Получаем документ
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise Exception(f"Документ {document_id} не найден")
        
        # Обновляем статус
        document.status = "processing"
        db.commit()
        
        # Инициализируем сервис LLM
        llm_service = LLMExtractionService()
        
        # Извлекаем данные из файла
        extracted_data = asyncio.run(
            llm_service.extract_from_file(document.file_path, document.mime_type)
        )
        
        if not extracted_data:
            document.status = "failed"
            document.error_message = "Не удалось извлечь данные из документа"
            db.commit()
            return {"status": "failed", "error": "Extraction failed"}
        
        # Сохраняем извлеченные метаданные
        document.raw_extracted_data = extracted_data.model_dump()
        if extracted_data.lab_name:
            document.lab_name = extracted_data.lab_name
        if extracted_data.report_date:
            try:
                document.report_date = datetime.fromisoformat(extracted_data.report_date)
            except:
                pass
        
        # Создаем результаты в БД
        result_ids = []
        for analyte_data in extracted_data.analytes:
            result = Result(
                document_id=document_id,
                source_label=analyte_data.name,
                raw_value=analyte_data.value,
                raw_unit=analyte_data.unit,
                raw_reference_range=analyte_data.reference_range,
                lab_comments=analyte_data.comments,
                flag=analyte_data.flag,
                normalized=False
            )
            db.add(result)
            db.flush()  # Получаем ID
            result_ids.append(result.id)
        
        document.status = "completed"
        db.commit()
        
        # Запускаем нормализацию результатов асинхронно
        for result_id in result_ids:
            normalize_result.delay(result_id)
        
        return {
            "status": "completed",
            "document_id": document_id,
            "results_count": len(result_ids),
            "result_ids": result_ids
        }
        
    except Exception as e:
        if document:
            document.status = "failed"
            document.error_message = str(e)
            db.commit()
        
        # Повторяем задачу с экспоненциальной задержкой
        raise self.retry(countdown=60 * (2 ** self.request.retries), exc=e)
        
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=2)
def normalize_result(self, result_id: int):
    """Нормализация отдельного результата"""
    db = SessionLocal()
    try:
        result = db.query(Result).filter(Result.id == result_id).first()
        if not result:
            raise Exception(f"Результат {result_id} не найден")
        
        normalization_service = NormalizationService(db)
        success = normalization_service.normalize_result(result)
        
        if success:
            db.commit()
            return {"status": "normalized", "result_id": result_id}
        else:
            return {"status": "normalization_failed", "result_id": result_id}
            
    except Exception as e:
        raise self.retry(countdown=30 * (2 ** self.request.retries), exc=e)
        
    finally:
        db.close()


@celery_app.task
def batch_normalize_results(result_ids: List[int]):
    """Пакетная нормализация результатов"""
    results = []
    for result_id in result_ids:
        try:
            result = normalize_result.delay(result_id)
            results.append({"result_id": result_id, "task_id": result.id})
        except Exception as e:
            results.append({"result_id": result_id, "error": str(e)})
    
    return {"batch_results": results}


@celery_app.task
def reprocess_document(document_id: int):
    """Повторная обработка документа"""
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return {"error": "Document not found"}
        
        # Удаляем старые результаты
        db.query(Result).filter(Result.document_id == document_id).delete()
        
        # Сбрасываем статус документа
        document.status = "pending"
        document.error_message = None
        document.raw_extracted_data = None
        db.commit()
        
        # Запускаем обработку заново
        process_document.delay(document_id)
        
        return {"status": "reprocessing_started", "document_id": document_id}
        
    finally:
        db.close()


@celery_app.task
def cleanup_old_tasks():
    """Очистка старых задач и результатов"""
    # TODO: Реализовать очистку старых задач из Redis
    pass


@celery_app.task
def health_check():
    """Проверка работоспособности воркеров"""
    return {"status": "healthy", "worker_id": current_task.request.id}