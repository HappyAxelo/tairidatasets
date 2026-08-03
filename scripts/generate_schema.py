"""Emit the full PostgreSQL DDL for the TAIRI DataHub schema.

Usage (from backend venv):
    python ../scripts/generate_schema.py > ../database/schema.sql
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure the backend package is importable regardless of CWD.
BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateIndex, CreateTable

import app.models  # noqa: F401 - populate metadata
from app.core.database import Base


def main() -> None:
    print("-- TAIRI DataHub — PostgreSQL schema")
    print("-- Auto-generated from SQLAlchemy models. Do not edit by hand.\n")
    for table in Base.metadata.sorted_tables:
        ddl = str(CreateTable(table).compile(dialect=postgresql.dialect()))
        print(ddl.strip() + ";\n")
        for index in table.indexes:
            print(str(CreateIndex(index).compile(dialect=postgresql.dialect())).strip() + ";")
        if table.indexes:
            print()


if __name__ == "__main__":
    main()
