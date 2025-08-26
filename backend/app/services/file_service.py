import asyncio
import uuid
from fastapi import UploadFile
from typing import Optional
import magic
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class FileService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key
        )
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=settings.s3_bucket)
        except ClientError:
            self.s3_client.create_bucket(Bucket=settings.s3_bucket)
    
    def validate_file(self, file: UploadFile) -> bool:
        if not file.filename:
            return False
        
        # Проверка размера
        if file.size and file.size > settings.max_file_size:
            return False
        
        # Проверка расширения
        extension = file.filename.split('.')[-1].lower()
        if extension not in settings.allowed_file_types:
            return False
        
        return True
    
    async def save_file(self, file: UploadFile, user_id: int) -> str:
        # Генерация уникального имени файла
        file_id = str(uuid.uuid4())
        extension = file.filename.split('.')[-1].lower()
        file_key = f"user_{user_id}/documents/{file_id}.{extension}"
        
        # Чтение содержимого файла
        content = await file.read()
        await file.seek(0)  # Сброс позиции для возможного повторного чтения
        
        # Загрузка в S3
        self.s3_client.put_object(
            Bucket=settings.s3_bucket,
            Key=file_key,
            Body=content,
            ContentType=file.content_type or 'application/octet-stream'
        )
        
        return file_key
    
    def get_file_url(self, file_path: str, expires_in: int = 3600) -> str:
        try:
            return self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.s3_bucket, 'Key': file_path},
                ExpiresIn=expires_in
            )
        except ClientError as e:
            logger.error(f"Error generating presigned URL for {file_path}: {str(e)}")
            return None
    
    async def get_file_content(self, file_path: str) -> Optional[bytes]:
        try:
            response = self.s3_client.get_object(Bucket=settings.s3_bucket, Key=file_path)
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"Error getting file content for {file_path}: {str(e)}")
            return None
    
    def delete_file(self, file_path: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=settings.s3_bucket, Key=file_path)
            return True
        except ClientError as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
            return False