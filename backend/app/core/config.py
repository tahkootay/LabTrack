from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://labtrack:labtrack@localhost:5432/labtrack"
    redis_url: str = "redis://localhost:6379"
    
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "labtrack-documents"
    
    openai_api_key: str
    secret_key: str = "change-this-secret-key"
    
    environment: str = "development"
    log_level: str = "INFO"
    
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_file_types: list[str] = ["pdf", "png", "jpg", "jpeg", "csv", "xlsx", "txt"]
    
    class Config:
        env_file = ".env"


settings = Settings()