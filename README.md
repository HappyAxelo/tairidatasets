<div align="center">

# TAIRI DataHub

### A Trusted Repository for AI Research Datasets

*Trustworthy Artificial Intelligence Research and Innovation (TAIRI) Lab — University of Rwanda*

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)]()
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2015-black)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL%2016-336791)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

</div>

---

TAIRI DataHub is a secure, self-hosted platform for publishing, discovering, sharing, citing
and governing research datasets — comparable to Kaggle, Zenodo and Hugging Face Datasets, but
built specifically for the University of Rwanda. It supports datasets of **any type and size**
(CSV, images, audio, video, medical scans, satellite imagery, notebooks, SQL dumps, and more)
with no file-type restrictions.

## ✨ Features

- **Role-based access** — Super Administrators, Student Researchers, Researchers and Guests
- **Dataset lifecycle** — upload, versioning (1.0 → 1.1 → 2.0), metadata, README, documentation
- **Access-request workflow** — request → review → approve/reject/more-info, with granular grants
  (view-only, download, download+API; permanent or time-limited)
- **Secure by design** — JWT auth with refresh tokens, bcrypt hashing, RBAC, rate limiting,
  audit logging, security headers, path-traversal-safe storage
- **Citations** — automatic APA, IEEE and BibTeX generation with `.bib` export
- **Search & discovery** — full-text search plus filters by research area, license, file type, year
- **Real-time notifications** — WebSocket delivery with polling fallback
- **Admin analytics** — datasets, users, downloads, storage, monthly uploads, popular domains
- **Pluggable storage** — local disk today; switch to MinIO/S3 with a single config change
- **Professional UI** — institutional design system (Inter, brand `#0056A6`), responsive, subtle motion

## 🧱 Tech stack

| Layer      | Technology                                             |
|------------|--------------------------------------------------------|
| Frontend   | Next.js 15 · TypeScript · TailwindCSS · Framer Motion · Recharts |
| Backend    | FastAPI · SQLAlchemy 2.0 · Pydantic v2                  |
| Database   | PostgreSQL 16                                          |
| Auth       | JWT (access + refresh) · bcrypt                         |
| Storage    | Local filesystem → MinIO / AWS S3 (pluggable)          |
| Deployment | Docker · Docker Compose · Nginx · Ubuntu Linux         |

## 🚀 Quick start (Docker)

```bash
git clone https://github.com/HappyAxelo/tairidatasets.git
cd tairidatasets
cp .env.example .env          # then edit the secrets
docker compose up -d --build
```

Then open:

- **App:** http://localhost
- **API docs (Swagger):** http://localhost/docs

The database is created and seeded automatically on first boot.

### Test accounts (seeded)

| Role               | Email                              | Password       |
|--------------------|------------------------------------|----------------|
| Super Administrator| `admin1@tairi.ur.ac.rw`            | `ChangeMe#2026`|
| Student Researcher | `aline.uwase@student.ur.ac.rw`     | `Student#2026` |
| Researcher         | `researcher@ur.ac.rw`              | `Researcher#2026` |

> ⚠️ Change all seeded passwords before any real deployment.

## ☁️ Free public deployment (Render)

Want a live public URL for free? The repo includes a one-file
[`render.yaml`](render.yaml) blueprint that provisions the frontend, backend and
a PostgreSQL database on [Render](https://render.com)'s free tier.

1. Sign in to Render → **New +** → **Blueprint** → connect this repo → **Apply**.
2. After the first build, set the two service URLs (frontend
   `BACKEND_INTERNAL_URL`, backend `FRONTEND_URL`).
3. Open the frontend URL and log in with the seeded accounts above.

Full click-by-click walkthrough (plus permanent free database and file storage):
**[docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md)**.

## 🛠️ Local development (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# For a quick start without Postgres, set DATABASE_URL=sqlite+pysqlite:///./dev.db
python -m app.seed
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000, proxies /api to http://localhost:8000
```

## ✅ Tests

```bash
cd backend && pytest          # 13 unit + integration tests
cd frontend && npm run build  # type-checked production build
```

## 📁 Project structure

```
tairidatasets/
├── backend/            # FastAPI application (clean architecture)
│   ├── app/
│   │   ├── core/       # config, database, security, deps, middleware
│   │   ├── models/     # SQLAlchemy ORM models
│   │   ├── schemas/    # Pydantic request/response models
│   │   ├── services/   # storage, email, notifications, citations, datasets
│   │   ├── api/v1/      # versioned REST endpoints
│   │   └── seed.py     # idempotent DB bootstrap + demo data
│   └── tests/          # pytest suite
├── frontend/           # Next.js 15 App Router
│   └── src/
│       ├── app/        # routes (site, dashboard, admin)
│       ├── components/ # UI system + feature components
│       └── lib/        # api client, auth context, types
├── database/           # generated PostgreSQL schema.sql
├── infrastructure/     # Nginx config
├── docs/               # installation, deployment, API, ER & architecture, manuals
├── scripts/            # schema generator and helpers
├── docker-compose.yml
└── README.md
```

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Installation](docs/INSTALLATION.md) | Local and server installation |
| [Deployment](docs/DEPLOYMENT.md) | Deploying on a University of Rwanda Ubuntu server |
| [Architecture](docs/ARCHITECTURE.md) | System architecture & request flow |
| [ER Diagram](docs/ER_DIAGRAM.md) | Database entity–relationship model |
| [API Reference](docs/API.md) | REST endpoints overview |
| [User Manual](docs/USER_MANUAL.md) | Guide for researchers and students |
| [Administrator Manual](docs/ADMIN_MANUAL.md) | Guide for super administrators |
| [Backup Guide](docs/BACKUP.md) | Database & storage backup/restore |

## 🔒 Roles at a glance

| Capability            | Super Admin | Student Researcher | Researcher | Guest |
|-----------------------|:-----------:|:------------------:|:----------:|:-----:|
| Browse & search       | ✅ | ✅ | ✅ | ✅ |
| View metadata         | ✅ | ✅ | ✅ | ✅ |
| Request access        | ✅ | ✅ | ✅ | — |
| Download (on approval)| ✅ | ✅ | ✅ | — |
| Upload datasets       | ✅ | ✅ | — | — |
| Approve own requests  | ✅ | ✅ | — | — |
| Approve datasets      | ✅ | — | — | — |
| Manage users          | ✅ | — | — | — |
| View analytics & logs | ✅ | — | — | — |

## 🧭 Roadmap (extension points already scaffolded)

- DOI minting integration (field + citation support already present)
- MinIO / AWS S3 object storage (`STORAGE_BACKEND=s3`)
- Institutional single sign-on (RBAC layer isolates auth)
- Antivirus scanning of uploads (per-file `virus_scan_status` placeholder)

## 📄 License

MIT — see [LICENSE](LICENSE). Built for the TAIRI Lab, University of Rwanda.
