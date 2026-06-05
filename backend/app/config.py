"""
Application configuration settings using Pydantic BaseSettings.
Loads configuration from environment variables or .env file.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI-Powered E-Commerce Sales Analysis Dashboard"
    DEBUG: bool = False
    VERSION: str = "1.0.0"

    # Multi-tenant (SQLite)
    # Tenant DBs will be created as: {SQLITE_DB_PATH_PREFIX}{tenant_id}.db
    SQLITE_DB_PATH_PREFIX: str = "./database/ecommerce_analytics_"

    # CORS
    # Include all known frontend dev origins (5173/5174) to avoid browser blocks.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"


    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ecommerce_analytics"

    # JWT
    # JWT signing key MUST be provided via environment variable (or .env).
    # If tokens don't work, ensure SECRET_KEY is identical in both token creation and verification.
    # Do not hardcode secrets in source.
    SECRET_KEY: str

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # GROQ (optional external knowledge/humanized responses)
    GROQ_API_KEY: str = ""
    GROQ_API_URL: str = ""

    # SQLite
    SQLITE_DB_PATH: str = "./database/ecommerce.db"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"
        env_ignore_empty = True


settings = Settings()

# Validate secrets at startup (prevents silently running with a wrong/empty JWT key).
if not settings.SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in environment variables or .env")

