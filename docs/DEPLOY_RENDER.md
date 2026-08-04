# Free Deployment on Render

This guide deploys TAIRI DataHub to a **public URL for free** using
[Render](https://render.com). The repository already contains a
[`render.yaml`](../render.yaml) blueprint that provisions everything:

| Resource | What it is | Free-tier behaviour |
|----------|------------|---------------------|
| `tairi-db` | PostgreSQL 16 database | Limited lifetime — see step 6 to make it permanent |
| `tairi-backend` | FastAPI API (Docker) | Sleeps after ~15 min idle |
| `tairi-frontend` | Next.js app (Docker) — the URL you share | Sleeps after ~15 min idle |

> **Cost:** $0. Render's free tier requires only a verified account (email +
> optional card for identity; the free plan is not charged). No credit card is
> spent unless you deliberately upgrade a service to a paid plan.

---

## Step 1 — Push the code to GitHub

Already done: <https://github.com/HappyAxelo/tairidatasets>. Render deploys
directly from this repository.

## Step 2 — Create a Render account

Go to <https://render.com> → **Get Started** → sign up (GitHub sign-in is
easiest, since Render then sees your repos automatically).

## Step 3 — Create the Blueprint

1. In the Render dashboard: **New +** → **Blueprint**.
2. Connect / pick the **`HappyAxelo/tairidatasets`** repository.
3. Render reads `render.yaml` and shows the three resources it will create.
4. Give the blueprint a name (e.g. `tairi-datahub`) and click **Apply**.

Render now builds the Docker images and provisions the database. The first
build takes **5–10 minutes** (it installs Python + Node dependencies).

## Step 4 — Wire the two service URLs

The frontend and backend need to know each other's public URL. After the first
build finishes, both services have URLs like
`https://tairi-frontend.onrender.com` and `https://tairi-backend.onrender.com`
(the exact names may include a random suffix if the name was taken — copy the
real ones from each service's page).

1. Open **tairi-frontend** → **Environment** → set
   `BACKEND_INTERNAL_URL` = the **backend** URL
   (e.g. `https://tairi-backend.onrender.com`) → **Save Changes**.
2. Open **tairi-backend** → **Environment** → set
   `FRONTEND_URL` = the **frontend** URL → **Save Changes**.

Saving an env var triggers an automatic redeploy of that service. Wait for both
to go green.

## Step 5 — Open your site 🎉

Visit the **frontend** URL. Log in with a seeded account:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin1@tairi.ur.ac.rw` | `ChangeMe#2026` |
| Student Researcher | `aline.uwase@student.ur.ac.rw` | `Student#2026` |
| Researcher | `researcher@ur.ac.rw` | `Researcher#2026` |

> **Change the admin password immediately** via Profile → Change Password, or by
> editing `SUPERADMIN_DEFAULT_PASSWORD` before the first deploy.

The database is seeded automatically on the backend's first boot (idempotent —
safe on every restart), so the four demo datasets appear right away.

---

## Step 6 (recommended) — Make the database permanent & free

Render's free PostgreSQL has a limited lifetime. For a database that stays free
forever, use [Neon](https://neon.tech) (0.5 GB free, no expiry) or
[Supabase](https://supabase.com):

1. Create a free Neon project → copy its connection string
   (`postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
2. In **tairi-backend** → **Environment**, replace the `DATABASE_URL` value with
   the Neon string → **Save**. The backend normalises the driver automatically
   and re-seeds on redeploy.
3. Optionally delete the `tairi-db` resource from Render.

## Step 7 (optional) — Persist uploaded files

On the free tier the container disk is ephemeral, so files uploaded to a dataset
are lost on redeploy. To keep them, point the storage layer at any
S3-compatible bucket (Supabase Storage and Cloudflare R2 both have free tiers):

Set these on **tairi-backend** → Environment:

```
STORAGE_BACKEND=s3
S3_ENDPOINT_URL=https://<your-endpoint>
S3_ACCESS_KEY=<key>
S3_SECRET_KEY=<secret>
S3_BUCKET=tairi-datasets
```

No code change is required — the backend swaps drivers at runtime.

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| First page load is slow / spins ~40s | Free service was asleep; it wakes on the first request. Normal. |
| Frontend loads but data/login fails | `BACKEND_INTERNAL_URL` not set or wrong (step 4). It must be the backend's full `https://…onrender.com` URL, no trailing slash. |
| Backend deploy fails at boot | Check the backend **Logs**. Usually `DATABASE_URL` isn't attached yet — confirm the `tairi-db` resource is live. |
| Notifications aren't real-time | WebSockets aren't proxied without Nginx; the bell falls back to polling. Full real-time works in the Docker Compose / Nginx deployment. |
| Want a custom domain (e.g. datahub.ur.ac.rw) | Each Render service → **Settings** → **Custom Domains**. Free. |
