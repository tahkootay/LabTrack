# LabTrack v1.0 - Медицинский трекер анализов

Безопасный сервис для хранения и систематизации медицинских анализов с автоматическим извлечением данных с помощью LLM.

## 🎯 Основные возможности

- **Загрузка документов**: PDF, изображения, CSV, Excel файлы
- **Автоматическое извлечение данных**: LLM с встроенным OCR
- **Нормализация показателей**: Приведение единиц, маппинг на справочники
- **Анонимность**: Персональные данные не сохраняются
- **Анализ динамики**: Сравнение с предыдущими результатами
- **Выявление отклонений**: Флаги выхода за референсы

## 🏗️ Архитектура

### Backend
- **FastAPI** (Python) - REST API
- **PostgreSQL** - основная БД
- **Redis** - кэш и очереди
- **Celery** - фоновые задачи
- **MinIO/S3** - файловое хранилище
- **OpenAI API** - извлечение данных из документов

### Frontend
- **React 18** с TypeScript
- **TanStack Query** - управление состоянием
- **Styled Components** - стилизация
- **React Router** - роутинг
- **Recharts** - графики

## 🚀 Быстрый старт

### Требования
- Docker и Docker Compose
- Node.js 18+ (для разработки фронтенда)
- Python 3.11+ (для разработки бэкенда)

### Запуск через Docker

1. **Клонируйте репозиторий**
```bash
git clone <repo-url>
cd LabTrack
```

2. **Настройте переменные окружения**
```bash
cp .env.example .env
# Отредактируйте .env файл, особенно OPENAI_API_KEY
```

3. **Запустите сервисы**
```bash
docker-compose up -d
```

4. **Выполните миграции БД**
```bash
docker-compose exec backend alembic upgrade head
```

5. **Откройте приложение**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API документация: http://localhost:8000/docs
- MinIO консоль: http://localhost:9001 (admin/minioadmin)

### Разработка

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\\Scripts\\activate   # Windows
pip install -r requirements.txt

# Запуск сервера разработки
uvicorn app.main:app --reload

# Запуск воркера Celery
celery -A app.core.celery worker --loglevel=info
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 📁 Структура проекта

```
LabTrack/
├── backend/                 # FastAPI приложение
│   ├── app/
│   │   ├── api/            # API эндпоинты
│   │   ├── core/           # Конфигурация, Celery
│   │   ├── db/             # База данных
│   │   ├── models/         # SQLAlchemy модели
│   │   ├── schemas/        # Pydantic схемы
│   │   ├── services/       # Бизнес-логика
│   │   └── utils/          # Утилиты
│   ├── migrations/         # Alembic миграции
│   └── tests/              # Тесты
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы
│   │   ├── services/       # API клиенты
│   │   ├── types/          # TypeScript типы
│   │   └── styles/         # Стили и темы
│   └── public/             # Статические файлы
├── docker/                 # Docker конфигурации
├── scripts/                # Скрипты развертывания
└── docs/                   # Документация
```

## 🔧 Конфигурация

### Переменные окружения (.env)

```bash
# База данных
DATABASE_URL=postgresql://labtrack:labtrack@localhost:5432/labtrack

# Redis
REDIS_URL=redis://localhost:6379

# S3 хранилище
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=labtrack-documents

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Безопасность
SECRET_KEY=your-secret-key-here

# Окружение
ENVIRONMENT=development
LOG_LEVEL=INFO
```

## 🔄 Процесс обработки документов

1. **Загрузка файла** → Валидация → Сохранение в S3
2. **Постановка в очередь** → Celery task
3. **LLM извлечение** → Структурированные данные
4. **Нормализация** → Маппинг показателей, конверсия единиц
5. **Сохранение результатов** → PostgreSQL
6. **Расчет дельт** → Сравнение с предыдущими результатами

## 🧪 Тестирование

```bash
# Backend тесты
cd backend
pytest

# Frontend тесты  
cd frontend
npm test
```

## 🚀 Развертывание

Для продуктивного окружения:

1. Используйте внешние сервисы (PostgreSQL, Redis, S3)
2. Настройте SSL/TLS
3. Добавьте мониторинг (Prometheus/Grafana)
4. Настройте автоматические бэкапы
5. Используйте секреты менеджер для API ключей

## 🤝 Вклад в разработку

1. Форкните репозиторий
2. Создайте ветку для фичи
3. Внесите изменения с тестами
4. Создайте Pull Request

## 📜 Лиценза

MIT License - детали в файле LICENSE

## 🆘 Поддержка

- Документация: `/docs`
- Issues: GitHub Issues
- Обсуждения: GitHub Discussions

---

**Версия 1.0** - Базовая функциональность для одного пользователя  
**Планы на v2.0**: Мультипользовательский режим, расширенная аналитика, мобильное приложение