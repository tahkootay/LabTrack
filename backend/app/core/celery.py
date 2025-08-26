from celery import Celery
from app.core.config import settings

# Создание экземпляра Celery
celery_app = Celery(
    "labtrack",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.core.tasks"]
)

# Конфигурация Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # task_routes={
    #     "app.core.tasks.process_document": {"queue": "document_processing"},
    #     "app.core.tasks.normalize_results": {"queue": "normalization"},
    # },
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)