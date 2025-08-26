# CLAUDE.md - LabTrack Project

## Project Overview
LabTrack is a secure medical analysis tracking service that helps users store and systematize medical test results with automatic data extraction using LLM technology.

## Key Features
- **Document Upload**: PDF, images, CSV, Excel files
- **Automatic Data Extraction**: LLM with built-in OCR
- **Parameter Normalization**: Unit conversion, reference range mapping
- **Privacy-Focused**: No personal data storage
- **Trend Analysis**: Comparison with previous results
- **Anomaly Detection**: Flags for out-of-range values

## Architecture

### Backend (Python + FastAPI)
- **FastAPI** - REST API framework
- **PostgreSQL** - primary database
- **Redis** - cache and task queues
- **Celery** - background task processing
- **MinIO/S3** - file storage
- **OpenAI API** - document data extraction

### Frontend (React + TypeScript)
- **React 18** with TypeScript
- **TanStack Query** - state management
- **Styled Components** - styling
- **React Router** - routing
- **Recharts** - charts and graphs

## Development Commands

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Run Celery worker
celery -A app.core.celery worker --loglevel=info

# Run database migrations
alembic upgrade head

# Run tests
pytest
```

### Frontend
```bash
cd frontend
npm install
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Docker
```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down
```

## Project Structure & Cleanliness

### 🏗️ Directory Organization
The project follows strict organizational principles to maintain clarity and scalability:

```
LabTrack/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration, Celery
│   │   ├── db/             # Database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── migrations/         # Alembic migrations
│   └── tests/              # Tests
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Pages
│   │   ├── services/       # API clients
│   │   ├── types/          # TypeScript types
│   │   └── styles/         # Styles and themes
│   └── public/             # Static files
├── docker/                 # Docker configurations
├── scripts/                # Deployment scripts
├── docs/                   # Documentation
├── README.md               # Main project documentation
├── CLAUDE.md               # Development guide (this file)
└── docker-compose.yml      # Service orchestration
```

### 🧹 Project Cleanliness Rules

#### ❌ What NOT to store in project root:
- **Temporary files** (logs, cache, build artifacts)
- **Environment-specific configs** (use `.env` instead)
- **User data** (uploads, generated content)
- **IDE-specific files** (.vscode, .idea - use .gitignore)
- **Legacy code** from previous projects
- **Experimental scripts** without clear purpose

#### ✅ What belongs in project root:
- **Essential config files** (`docker-compose.yml`, `.env.example`)
- **Documentation** (`README.md`, `CLAUDE.md`)
- **Package managers** (`package.json` for monorepo, if needed)
- **CI/CD configs** (`.github/`, `.gitlab-ci.yml`)
- **Git configuration** (`.gitignore`, `.gitattributes`)

#### 📁 Proper file organization:
- **Logs**: Use `/backend/logs/` or external logging service
- **Uploads**: Store in S3/MinIO, not in project directory  
- **Build artifacts**: Use `/backend/dist/`, `/frontend/build/`
- **Scripts**: Organize in `/scripts/` with clear naming
- **Documentation**: Keep in `/docs/` with structured naming
- **Tests**: Mirror source structure in respective `/tests/` folders

#### 🔄 Maintenance practices:
- **Regular cleanup**: Remove unused dependencies and files
- **Clear naming**: Use descriptive file and directory names
- **Consistent structure**: Follow established patterns across modules
- **Documentation**: Keep directory purpose clear with README files
- **Version control**: Don't commit generated files, use .gitignore

#### 🚨 Project hygiene checklist:
- [ ] No temporary files in root directory
- [ ] All configurations in appropriate subdirectories
- [ ] Clear separation between frontend/backend/infrastructure
- [ ] Documentation is up-to-date and properly located
- [ ] No legacy code from previous projects
- [ ] Build artifacts are excluded from version control
- [ ] Environment variables are properly configured

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key for document processing
- `SECRET_KEY` - Application secret key
- `S3_ENDPOINT` - S3/MinIO endpoint
- `S3_ACCESS_KEY` - S3/MinIO access key
- `S3_SECRET_KEY` - S3/MinIO secret key
- `S3_BUCKET` - S3/MinIO bucket name

### Optional Environment Variables
- `ENVIRONMENT` - deployment environment (development/production)
- `LOG_LEVEL` - logging level (DEBUG/INFO/WARNING/ERROR)

## Data Processing Pipeline
1. **File Upload** → Validation → S3 Storage → Document record creation
2. **Queue Processing** → Celery task creation
3. **LLM Extraction** → Structured data extraction with OCR
4. **Normalization** → Parameter mapping, unit conversion
5. **Result Storage** → PostgreSQL storage with versioning
6. **Delta Calculation** → Comparison with previous results

## Testing
- Backend tests use pytest
- Frontend tests use Jest and React Testing Library
- Integration tests available for API endpoints
- Unit tests cover core business logic

## Security & Privacy
- No personal patient data stored
- Technical identifiers only
- Secure file storage with S3
- API authentication ready for multi-user expansion

## Version 1.0 Limitations
- Single user mode (no authentication)
- Basic functionality focused on core features
- Architecture prepared for multi-user expansion in v2.0

## Future Roadmap (v2.0+)
- Multi-user support with authentication
- Enhanced analytics and reporting
- Mobile application
- Extended sharing capabilities
- Advanced reference range management