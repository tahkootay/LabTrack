from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.database import get_db


def get_current_user():
    # В v1 всегда возвращаем дефолтного пользователя
    return {"id": 1, "email": None}


def get_current_user_id(current_user: dict = Depends(get_current_user)) -> int:
    return current_user["id"]