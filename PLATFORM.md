# bulk_extractor Platform

A standalone OSINT microservice wrapping the bulk_extractor C++ engine with PostgreSQL, FastAPI, Celery, Redis, and an Angular front-end.

## Stack
- **Engine**: C++ bulk_extractor (compiled from this repository)
- **API**: Python 3.11 + FastAPI + SQLAlchemy 2 + Alembic
- **Jobs**: Celery + Redis
- **Database**: PostgreSQL 15
- **Front-end**: Angular + TypeScript

## Quick Start

```bash
# 1. Start all services
docker compose up

# 2. Run DB migrations (first time only)
docker compose exec api alembic upgrade head

# 3. Open the UI
open http://localhost:4201/bulk-extractor/
```

## API
Interactive docs at http://localhost:8000/docs

## Using the application

After signing in as `User`, open **Instructions** from the left rail for the
in-application operator guide. The current scan workflow accepts a server-side
path to evidence that is already accessible to the worker; browser uploads and
result exports are not currently provided.

The Connector integrates with this standalone service through its `/health`
and `/metadata` endpoints. The service remains independently deployable and
does not run inside The Connector process.

## Key Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Sign in as the single passwordless generic `User` account |
| GET/POST | /cases | List / create cases |
| POST | /cases/{id}/scans | Submit a scan |
| GET | /scans/{id}/features | Query extracted features |
| GET | /scans/{id}/histograms | Histogram data |
| GET | /scans/{id}/summary | Feature type counts |
| WS | /scans/{id}/progress | Real-time scan progress |
