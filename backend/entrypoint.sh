#!/usr/bin/env bash
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
python - <<'PY'
import os, time
import psycopg
host = os.getenv("POSTGRES_HOST", "db")
port = os.getenv("POSTGRES_PORT", "5432")
user = os.getenv("POSTGRES_USER", "tairi")
pwd = os.getenv("POSTGRES_PASSWORD", "tairi_password")
db = os.getenv("POSTGRES_DB", "tairi_datahub")
for attempt in range(60):
    try:
        psycopg.connect(host=host, port=port, user=user, password=pwd, dbname=db).close()
        print("Database is ready.")
        break
    except Exception as exc:
        print(f"  ...not ready ({attempt}): {exc}")
        time.sleep(2)
else:
    raise SystemExit("Database did not become ready in time")
PY

echo "Seeding database (idempotent)..."
python -m app.seed

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips="*"
