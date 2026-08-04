#!/usr/bin/env bash
set -e

echo "Waiting for PostgreSQL..."
python - <<'PY'
import os, time
import psycopg

url = os.getenv("DATABASE_URL")
for attempt in range(60):
    try:
        if url:
            # Managed hosts (Render/Neon/Supabase) provide a libpq-style URL.
            # Strip any SQLAlchemy driver suffix before handing it to psycopg.
            conninfo = url.replace("+psycopg", "")
            psycopg.connect(conninfo).close()
        else:
            psycopg.connect(
                host=os.getenv("POSTGRES_HOST", "db"),
                port=os.getenv("POSTGRES_PORT", "5432"),
                user=os.getenv("POSTGRES_USER", "tairi"),
                password=os.getenv("POSTGRES_PASSWORD", "tairi_password"),
                dbname=os.getenv("POSTGRES_DB", "tairi_datahub"),
            ).close()
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

# Managed platforms (Render, Railway, Fly) inject the listening port via $PORT.
PORT="${PORT:-8000}"
echo "Starting API server on port ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" \
    --proxy-headers --forwarded-allow-ips="*"
