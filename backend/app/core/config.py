from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://labtrack:labtrack@localhost:5432/labtrack")
    redis_url: str = "redis://localhost:6379"
    
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = os.getenv("S3_ACCESS_KEY", "minioadmin")
    s3_secret_key: str = os.getenv("S3_SECRET_KEY", "minioadmin")
    s3_bucket: str = "labtrack-documents"
    
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    secret_key: str = os.getenv("SECRET_KEY", "change-this-secret-key-for-production")
    
    environment: str = "development"
    log_level: str = "INFO"
    
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_file_types: List[str] = ["pdf", "png", "jpg", "jpeg", "csv", "xlsx", "txt"]
    
    def __post_init__(self):
        """Validate critical environment variables"""
        if self.environment == "production":
            if not self.openai_api_key:
                raise ValueError("OPENAI_API_KEY is required in production")
            if self.secret_key == "change-this-secret-key-for-production":
                raise ValueError("SECRET_KEY must be changed in production")
    
    class Config:
        env_file = ".env"


settings = Settings()