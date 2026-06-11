# bulk_extractor Platform

A full-stack forensics platform wrapping the bulk_extractor C++ engine with a PostgreSQL database, FastAPI REST API, and React front-end.

## Stack
- **Engine**: C++ bulk_extractor (unchanged, in `engine/`)
- **API**: Python 3.11 + FastAPI + SQLAlchemy 2 + Alembic
- **Jobs**: Celery + Redis
- **Database**: PostgreSQL 15
- **Front-end**: React 18 + TypeScript + Vite + Tailwind + Recharts

## Quick Start

```bash
# 1. Start all services
docker compose up

# 2. Run DB migrations (first time only)
docker compose exec api alembic upgrade head

# 3. Open the UI
open http://localhost:5173
```

## API
Interactive docs at http://localhost:8000/docs

## Key Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Get JWT token |
| GET/POST | /cases | List / create cases |
| POST | /cases/{id}/scans | Submit a scan |
| GET | /scans/{id}/features | Query extracted features |
| GET | /scans/{id}/histograms | Histogram data |
| GET | /scans/{id}/summary | Feature type counts |
| WS | /scans/{id}/progress | Real-time scan progress |
