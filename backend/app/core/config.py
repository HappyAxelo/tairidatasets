"""Application configuration loaded from environment variables.

All settings are centralised here so that the rest of the codebase never reads
``os.environ`` directly. This keeps configuration testable and makes it trivial
to swap local storage for MinIO/S3 or Postgres credentials without touching
business logic.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated, List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Application ---------------------------------------------------------
    PROJECT_NAME: str = "TAIRI DataHub"
    PROJECT_DESCRIPTION: str = "A Trusted Repository for AI Research Datasets"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Security ------------------------------------------------------------
    SECRET_KEY: str = "change-me-in-production-please-use-a-long-random-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    # Idle session timeout (minutes) enforced client-side and via token expiry.
    SESSION_TIMEOUT_MINUTES: int = 60
    # Rate limiting can be disabled (e.g. in tests) or tuned per deployment.
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 120
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # --- Database ------------------------------------------------------------
    POSTGRES_USER: str = "tairi"
    POSTGRES_PASSWORD: str = "tairi_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "tairi_datahub"
    DATABASE_URL: str | None = None

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.DATABASE_URL:
            return self._normalize_db_url(self.DATABASE_URL)
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @staticmethod
    def _normalize_db_url(url: str) -> str:
        """Normalise a provider-supplied connection string for SQLAlchemy.

        Managed hosts (Render, Neon, Supabase, Heroku) hand out URLs beginning
        with ``postgres://`` or ``postgresql://``, which SQLAlchemy would route
        to the psycopg2 driver. This project uses psycopg 3, so the scheme is
        rewritten to ``postgresql+psycopg://``. SQLite URLs pass through
        untouched for local/test use.
        """
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://"):]
        return url

    # --- CORS ----------------------------------------------------------------
    # NoDecode disables pydantic-settings' automatic JSON parsing of list env
    # vars, so plain values like "*" or "https://a.com,https://b.com" are handled
    # by the validator below instead of failing a json.loads() call.
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, value):  # noqa: D401
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                import json

                return json.loads(stripped)
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return value

    # --- Storage -------------------------------------------------------------
    # STORAGE_BACKEND selects the concrete storage driver at runtime.
    # "local" -> LocalStorage, "s3" -> S3Storage (MinIO / AWS compatible).
    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "storage"
    MAX_UPLOAD_SIZE_MB: int = 5120  # 5 GB per file; adjust for institution needs.

    # S3 / MinIO (only used when STORAGE_BACKEND == "s3")
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    S3_BUCKET: str = "tairi-datasets"
    S3_REGION: str = "us-east-1"

    # --- Email ---------------------------------------------------------------
    # When SMTP is not configured, emails are logged instead of sent, so the
    # platform runs out-of-the-box in development.
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str = "no-reply@tairi.ur.ac.rw"
    SMTP_TLS: bool = True
    FRONTEND_URL: str = "http://localhost:3000"

    # --- Bootstrap super administrators -------------------------------------
    # Exactly three super-admin accounts are provisioned during seeding.
    SUPERADMIN_EMAILS: Annotated[List[str], NoDecode] = Field(
        default=[
            "admin1@tairi.ur.ac.rw",
            "admin2@tairi.ur.ac.rw",
            "admin3@tairi.ur.ac.rw",
        ]
    )
    SUPERADMIN_DEFAULT_PASSWORD: str = "ChangeMe#2026"

    @field_validator("SUPERADMIN_EMAILS", mode="before")
    @classmethod
    def _split_admins(cls, value):
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                import json

                return json.loads(stripped)
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


settings = get_settings()
