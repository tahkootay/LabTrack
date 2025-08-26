import base64
from typing import Dict, List, Optional, Any
import openai
from pydantic import BaseModel
from app.core.config import settings
from app.services.file_service import FileService
import json
import logging

logger = logging.getLogger(__name__)


class ExtractedAnalyte(BaseModel):
    name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    flag: Optional[str] = None  # H, L, N и т.д.
    comments: Optional[str] = None


class ExtractedDocument(BaseModel):
    lab_name: Optional[str] = None
    patient_id: Optional[str] = None  # Будем игнорировать для анонимности
    report_date: Optional[str] = None
    report_type: Optional[str] = None
    analytes: List[ExtractedAnalyte] = []
    additional_comments: Optional[str] = None


class LLMExtractionService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
        self.file_service = FileService()
    
    def _get_extraction_schema(self) -> Dict[str, Any]:
        """Возвращает JSON схему для структурированной экстракции"""
        return {
            "type": "object",
            "properties": {
                "lab_name": {
                    "type": "string",
                    "description": "Название лаборатории"
                },
                "report_date": {
                    "type": "string",
                    "description": "Дата отчета в формате YYYY-MM-DD"
                },
                "report_type": {
                    "type": "string",
                    "description": "Тип анализа (биохимия крови, общий анализ крови и т.д.)"
                },
                "analytes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Название показателя"
                            },
                            "value": {
                                "type": "string",
                                "description": "Значение показателя"
                            },
                            "unit": {
                                "type": "string",
                                "description": "Единица измерения"
                            },
                            "reference_range": {
                                "type": "string",
                                "description": "Референсные значения"
                            },
                            "flag": {
                                "type": "string",
                                "description": "Флаг (H - высокий, L - низкий, N - норма)"
                            },
                            "comments": {
                                "type": "string",
                                "description": "Комментарии к показателю"
                            }
                        },
                        "required": ["name", "value"]
                    }
                },
                "additional_comments": {
                    "type": "string",
                    "description": "Дополнительные комментарии или заключения"
                }
            },
            "required": ["analytes"]
        }
    
    def _get_system_prompt(self) -> str:
        return """Ты эксперт по извлечению данных из медицинских лабораторных отчетов.

Твоя задача:
1. Извлечь структурированные данные из лабораторного отчета
2. НЕ извлекать персональные данные пациента (ФИО, дата рождения, адрес)
3. Сосредоточиться на медицинских показателях и их значениях
4. Сохранить точность числовых значений и единиц измерения
5. Извлечь референсные диапазоны если они указаны

Важно:
- Если значение показателя представлено как диапазон (например "5.2-6.8"), сохрани как есть
- Если есть флаги отклонения (↑, ↓, H, L, +, -), укажи их в поле flag
- Единицы измерения могут быть в различных форматах (ммоль/л, г/л, ×10³/мкл и т.д.)
- Некоторые показатели могут быть текстовыми (положительный/отрицательный)

Верни результат строго в указанном JSON формате."""
    
    async def extract_from_file(self, file_path: str, mime_type: str) -> Optional[ExtractedDocument]:
        """Извлекает данные из файла с помощью LLM"""
        try:
            file_content = await self.file_service.get_file_content(file_path)
            if not file_content:
                return None
            
            # Для изображений и PDF используем vision API
            if mime_type.startswith('image/') or mime_type == 'application/pdf':
                return await self._extract_from_image(file_content, mime_type)
            else:
                # Для текстовых файлов
                return await self._extract_from_text(file_content.decode('utf-8'))
                
        except Exception as e:
            logger.error(f"Error extracting data from file {file_path}: {str(e)}", exc_info=True)
            return None
    
    async def _extract_from_image(self, file_content: bytes, mime_type: str) -> Optional[ExtractedDocument]:
        """Извлечение данных из изображения или PDF через Vision API"""
        try:
            base64_content = base64.b64encode(file_content).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Извлеки данные из этого медицинского отчета согласно схеме."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_content}"
                                }
                            }
                        ]
                    }
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "medical_report_extraction",
                        "schema": self._get_extraction_schema()
                    }
                },
                temperature=0.1,
                max_tokens=4000
            )
            
            extracted_data = json.loads(response.choices[0].message.content)
            return ExtractedDocument(**extracted_data)
            
        except Exception as e:
            print(f"Ошибка при извлечении из изображения: {str(e)}")
            return None
    
    async def _extract_from_text(self, text_content: str) -> Optional[ExtractedDocument]:
        """Извлечение данных из текстового содержимого"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": f"Извлеки данные из этого медицинского отчета:\n\n{text_content}"
                    }
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "medical_report_extraction",
                        "schema": self._get_extraction_schema()
                    }
                },
                temperature=0.1,
                max_tokens=4000
            )
            
            extracted_data = json.loads(response.choices[0].message.content)
            return ExtractedDocument(**extracted_data)
            
        except Exception as e:
            print(f"Ошибка при извлечении из текста: {str(e)}")
            return None