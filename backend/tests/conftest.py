"""Pytest fixtures: an isolated SQLite database and a TestClient.

Uses SQLite so the suite runs without a Postgres server. The schema is created
from the SQLAlchemy metadata, exercising every model mapping.
"""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("STORAGE_BACKEND", "local")
os.environ.setdefault("RATE_LIMIT_ENABLED", "False")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.core.database as database_module
from app.core.database import Base, get_db

# Single shared in-memory SQLite connection for the whole test session.
_engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)

# Point the app's session factory at the test engine.
database_module.engine = _engine
database_module.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    import app.models  # noqa: F401 - populate metadata

    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    from app.main import app

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded(db_session):
    """Seed roles, taxonomy and users into the test database."""
    from app.seed import seed_roles_permissions, seed_taxonomy, seed_users

    roles = seed_roles_permissions(db_session)
    seed_taxonomy(db_session)
    students = seed_users(db_session, roles)
    db_session.commit()
    return {"roles": roles, "students": students}
