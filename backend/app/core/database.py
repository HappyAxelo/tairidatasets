"""Database engine, session factory and declarative base.

Uses SQLAlchemy 2.0 style. A single engine is created for the process and
short-lived sessions are yielded per-request via :func:`get_db`.
"""
from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

_db_uri = settings.sqlalchemy_database_uri
# Connection pooling options only apply to server databases (Postgres). SQLite
# — used in tests — rejects them, so they are omitted for that dialect.
_engine_kwargs: dict = {"future": True, "pool_pre_ping": True}
if not _db_uri.startswith("sqlite"):
    _engine_kwargs.update(pool_size=10, max_overflow=20)
else:  # pragma: no cover - test convenience
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(_db_uri, **_engine_kwargs)

SessionLocal = sessionmaker(
    bind=engine, autocommit=False, autoflush=False, expire_on_commit=False, future=True
)


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model."""


def get_db() -> Generator:
    """FastAPI dependency that provides a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
