from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import settings
from .database import Base, engine
from .routers.auth import router as auth_router
from .routers.cases import router as cases_router
from .routers.scans import router as scans_router, scan_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await connection.execute(text(
            "INSERT INTO users (email, hashed_password, role, created_at) "
            "SELECT 'User', '', 'admin', now() "
            "WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = 'user')"
        ))
        await connection.execute(text(
            "UPDATE users SET email = 'User', hashed_password = '', role = 'admin' "
            "WHERE lower(email) = 'user'"
        ))
        await connection.execute(text(
            "UPDATE cases SET created_by = (SELECT id FROM users WHERE email = 'User' LIMIT 1)"
        ))
        await connection.execute(text("DELETE FROM users WHERE email <> 'User'"))
    yield


app = FastAPI(title="bulk_extractor Platform", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_allowed_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(cases_router)
app.include_router(scans_router)
app.include_router(scan_router)

@app.get("/health")
async def health():
    engine_path = Path(settings.engine_binary)
    return {
        "status": "ok",
        "service": "bulk-extractor",
        "version": app.version,
        "engineAvailable": engine_path.is_file(),
    }


@app.get("/metadata")
async def metadata():
    return {
        "service": "bulk-extractor",
        "version": app.version,
        "engine": "bulk_extractor",
        "engineAvailable": Path(settings.engine_binary).is_file(),
    }
