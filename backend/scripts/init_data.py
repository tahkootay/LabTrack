"""
Скрипт для инициализации базовых данных в LabTrack
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models import User, Analyte

def init_database():
    """Инициализация базовых данных"""
    db: Session = SessionLocal()
    
    try:
        # Создаем дефолтного пользователя для v1
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(
                id=1,
                email=None,
                is_active=True
            )
            db.add(user)
            db.commit()
            print("✅ Создан дефолтный пользователь")
        else:
            print("📋 Дефолтный пользователь уже существует")
        
        # Создаем базовые аналиты
        analytes_data = [
            {
                "code": "glucose",
                "name": "Глюкоза",
                "default_unit": "ммоль/л",
                "unit_category": "concentration",
                "description": "Основной показатель углеводного обмена",
                "reference_ranges": {"normal": {"min": 3.9, "max": 5.5}}
            },
            {
                "code": "hemoglobin",
                "name": "Гемоглобин",
                "default_unit": "г/л", 
                "unit_category": "concentration",
                "description": "Белок эритроцитов, переносящий кислород",
                "reference_ranges": {
                    "male": {"min": 130, "max": 160},
                    "female": {"min": 120, "max": 150}
                }
            },
            {
                "code": "cholesterol",
                "name": "Холестерин общий",
                "default_unit": "ммоль/л",
                "unit_category": "concentration", 
                "description": "Общий холестерин в крови",
                "reference_ranges": {"normal": {"max": 5.2}}
            },
            {
                "code": "creatinine",
                "name": "Креатинин",
                "default_unit": "мкмоль/л",
                "unit_category": "concentration",
                "description": "Продукт распада креатина, показатель функции почек",
                "reference_ranges": {
                    "male": {"min": 62, "max": 115},
                    "female": {"min": 53, "max": 97}
                }
            },
            {
                "code": "urea",
                "name": "Мочевина",
                "default_unit": "ммоль/л",
                "unit_category": "concentration",
                "description": "Конечный продукт белкового обмена",
                "reference_ranges": {"normal": {"min": 2.8, "max": 7.2}}
            },
            {
                "code": "alt",
                "name": "АЛТ (Аланинаминотрансфераза)",
                "default_unit": "Ед/л",
                "unit_category": "activity",
                "description": "Фермент печени",
                "reference_ranges": {
                    "male": {"max": 41},
                    "female": {"max": 31}
                }
            }
        ]
        
        created_count = 0
        for analyte_data in analytes_data:
            existing = db.query(Analyte).filter(Analyte.code == analyte_data["code"]).first()
            if not existing:
                analyte = Analyte(**analyte_data)
                db.add(analyte)
                created_count += 1
        
        db.commit()
        print(f"✅ Создано {created_count} новых аналитов")
        
        # Показываем статистику
        total_users = db.query(User).count()
        total_analytes = db.query(Analyte).count()
        
        print("\n📊 Статистика базы данных:")
        print(f"   👤 Пользователей: {total_users}")
        print(f"   🔬 Аналитов: {total_analytes}")
        print("   📄 Документов: 0")
        print("   📈 Результатов: 0")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при инициализации данных: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Инициализация базовых данных LabTrack...")
    init_database()
    print("✅ Инициализация завершена!")