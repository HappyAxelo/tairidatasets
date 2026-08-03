# Installation Guide

This guide covers installing TAIRI DataHub for local development and evaluation.
For production deployment on a University of Rwanda server, see
[DEPLOYMENT.md](DEPLOYMENT.md).

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker + Docker Compose | 24+ | Recommended path — installs everything |
| Python | 3.12+ | Only for running the backend without Docker |
| Node.js | 20+ | Only for running the frontend without Docker |
| PostgreSQL | 16 | Provided by Docker; optional for local dev (SQLite works) |

## Option A — Docker (recommended)

```bash
git clone https://github.com/HappyAxelo/tairidatasets.git
cd tairidatasets
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, SECRET_KEY, SUPERADMIN_* values.
docker compose up -d --build
```

- Frontend + API served at **http://localhost**
- Swagger docs at **http://localhost/docs**
- The backend waits for PostgreSQL, then seeds roles, taxonomy, users and demo datasets.

To view logs: `docker compose logs -f backend`
To stop: `docker compose down` (add `-v` to also remove data volumes).

## Option B — Manual (no Docker)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

For a zero-dependency start, use SQLite by setting in `.env`:

```
DATABASE_URL=sqlite+pysqlite:///./dev.db
```

Otherwise point `POSTGRES_*` at a running PostgreSQL instance. Then:

```bash
python -m app.seed         # create tables + seed data
uvicorn app.main:app --reload
```

API is now at http://localhost:8000 (docs at `/docs`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at http://localhost:3000 and proxies `/api/*` to the backend
at http://localhost:8000 (configurable via `BACKEND_INTERNAL_URL`).

## Verifying the installation

```bash
# Backend health
curl http://localhost:8000/health        # {"status":"ok"}

# Run the test suite
cd backend && pytest

# Type-check + build the frontend
cd frontend && npm run build
```

## Regenerating the SQL schema

```bash
cd backend && source .venv/bin/activate
python ../scripts/generate_schema.py > ../database/schema.sql
```

## Troubleshooting

- **`connection refused` on first boot** — the backend retries Postgres for ~2 minutes;
  check `docker compose logs db`.
- **Emails not sending** — with `SMTP_HOST` unset, emails are logged to the backend
  console instead of sent. This is expected in development.
- **Port already in use** — change the published port in `docker-compose.yml` (`nginx`
  service) or stop the conflicting process.
