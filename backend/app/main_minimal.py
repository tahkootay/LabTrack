from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

app = FastAPI(
    title="LabTrack API",
    description="API для систематизации медицинских анализов",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "LabTrack API v1.0", 
        "status": "running",
        "features": [
            "Загрузка медицинских документов",
            "Автоматическое извлечение данных с помощью LLM", 
            "Нормализация показателей",
            "Анализ динамики результатов"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/info")
async def app_info():
    return {
        "name": "LabTrack",
        "version": "1.0.0",
        "description": "Безопасный сервис для систематизации медицинских анализов",
        "endpoints": [
            "/users - управление пользователями",
            "/documents - управление документами", 
            "/results - результаты анализов",
            "/analytes - справочник аналитов"
        ]
    }

# User endpoints (без Pydantic моделей)
@app.get("/users")
def get_users(skip: int = 0, limit: int = 10):
    return [
        {
            "id": 1,
            "email": None,
            "is_active": True,
            "created_at": "2024-01-01T00:00:00"
        }
    ]

@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id == 1:
        return {
            "id": 1,
            "email": None,
            "is_active": True,
            "created_at": "2024-01-01T00:00:00"
        }
    raise HTTPException(status_code=404, detail="User not found")

# Document endpoints
@app.get("/documents")
def get_documents(skip: int = 0, limit: int = 10):
    return []

@app.get("/documents/{document_id}")
def get_document(document_id: int):
    raise HTTPException(status_code=404, detail="Document not found")

@app.post("/documents")
def create_document(document_data: Dict[str, Any]):
    return {
        "id": 1,
        "user_id": 1,
        "filename": document_data.get("filename", "unknown.pdf"),
        "file_path": f"/uploads/{document_data.get('filename', 'unknown.pdf')}",
        "status": "pending",
        "created_at": "2024-01-01T00:00:00"
    }

# Result endpoints
@app.get("/results")
def get_results(
    document_id: int = None,
    analyte_id: int = None,
    skip: int = 0, 
    limit: int = 50
):
    return []

@app.get("/results/{result_id}")
def get_result(result_id: int):
    raise HTTPException(status_code=404, detail="Result not found")

# Analyte endpoints
@app.get("/analytes")
def get_analytes(skip: int = 0, limit: int = 100):
    return [
        {
            "id": 1,
            "code": "glucose",
            "name": "Глюкоза",
            "default_unit": "ммоль/л",
            "reference_ranges": {"normal": {"min": 3.9, "max": 5.5}}
        },
        {
            "id": 2,
            "code": "hemoglobin", 
            "name": "Гемоглобин",
            "default_unit": "г/л",
            "reference_ranges": {
                "male": {"min": 130, "max": 160},
                "female": {"min": 120, "max": 150}
            }
        },
        {
            "id": 3,
            "code": "cholesterol",
            "name": "Холестерин общий",
            "default_unit": "ммоль/л", 
            "reference_ranges": {"normal": {"max": 5.2}}
        }
    ]

@app.get("/analytes/{analyte_id}")
def get_analyte(analyte_id: int):
    analytes = {
        1: {
            "id": 1,
            "code": "glucose", 
            "name": "Глюкоза",
            "default_unit": "ммоль/л",
            "reference_ranges": {"normal": {"min": 3.9, "max": 5.5}}
        },
        2: {
            "id": 2,
            "code": "hemoglobin",
            "name": "Гемоглобин", 
            "default_unit": "г/л",
            "reference_ranges": {
                "male": {"min": 130, "max": 160},
                "female": {"min": 120, "max": 150}
            }
        },
        3: {
            "id": 3,
            "code": "cholesterol",
            "name": "Холестерин общий",
            "default_unit": "ммоль/л",
            "reference_ranges": {"normal": {"max": 5.2}}
        }
    }
    if analyte_id in analytes:
        return analytes[analyte_id]
    raise HTTPException(status_code=404, detail="Analyte not found")

@app.post("/analytes")
def create_analyte(analyte_data: Dict[str, Any]):
    return {
        "id": 999,
        **analyte_data
    }

# Stats endpoint
@app.get("/stats")
def get_stats():
    return {
        "total_documents": 0,
        "total_results": 0,
        "total_analytes": 3,
        "processed_documents": 0,
        "pending_documents": 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)