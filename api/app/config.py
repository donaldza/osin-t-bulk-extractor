from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://be_user:be_password@localhost:5432/bulk_extractor"
    sync_database_url: str = "postgresql+psycopg2://be_user:be_password@localhost:5432/bulk_extractor"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-in-production"
    engine_binary: str = "/usr/local/bin/bulk_extractor"
    scans_dir: str = "/scans"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    cors_allowed_origins: str = "http://localhost:4201,http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
