# Frontend on Vercel + Backend on Render (best free setup)

This is the recommended free hosting layout:

| Piece | Host | Sleeps? |
|-------|------|---------|
| Frontend (Next.js) | **Vercel** (free Hobby) | **Never** |
| Backend (FastAPI) | Render (free) — kept awake by a pinger | No (pinger keeps it up) |
| Database (Postgres) | Render (free) or Neon | No |

Vercel never sleeps and has its own free quota, so the frontend is always instant
and Render's 750 free hours are spent only on the backend.

---

## Part A — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up** (use **Continue with GitHub**).
2. **Add New… → Project** → import **`HappyAxelo/tairidatasets`**.
3. **Configure the project** (important — the frontend is in a subfolder):
   - **Root Directory** → click **Edit** → select **`frontend`**.
   - Framework Preset: **Next.js** (auto-detected).
   - Build/Output settings: leave defaults.
4. **Environment Variables** → add one:
   | Name | Value |
   |------|-------|
   | `BACKEND_INTERNAL_URL` | `https://tairi-backend.onrender.com` |
5. Click **Deploy**. In ~2 minutes you get a URL like `https://tairidatasets.vercel.app`.

That Vercel URL is your new public site.

## Part B — Point the backend at the new frontend

In Render → **tairi-backend** → **Environment**, update:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | your Vercel URL (e.g. `https://tairidatasets.vercel.app`) |
| `BACKEND_CORS_ORIGINS` | your Vercel URL |

**Save** (backend redeploys automatically).

## Part C — Keep the backend awake (no more cold-start 502s)

Add a free uptime pinger so the backend never sleeps:

1. Go to [cron-job.org](https://cron-job.org) → sign up (free).
2. **Create cronjob**:
   - Title: `tairi-backend keepalive`
   - URL: `https://tairi-backend.onrender.com/health`
   - Schedule: **every 10 minutes**
3. Save & enable.

*(Alternative: [UptimeRobot](https://uptimerobot.com) — add an HTTP monitor on the
same URL at a 5-minute interval.)*

## Part D — Free up Render hours (optional but recommended)

Now that Vercel serves the frontend, delete the old Render frontend so the
backend gets the full 750 free hours:

- Render → **tairi-frontend** → **Settings** → **Delete Web Service**.

---

## Result
- **Frontend:** always-on at your Vercel URL, instant loads.
- **Backend:** kept awake by the pinger — login/register/downloads respond immediately.
- **Cost:** still $0.

## Custom domain (optional)
Add `datahub.ur.ac.rw` (or similar) in **Vercel → Project → Settings → Domains** —
free, with automatic HTTPS.

## Troubleshooting
| Symptom | Fix |
|---------|-----|
| Vercel build fails: "No Next.js detected" | Root Directory isn't set to `frontend`. Project → Settings → General → Root Directory. |
| Login/data fails on the Vercel site | `BACKEND_INTERNAL_URL` missing or wrong in Vercel → Settings → Environment Variables (then redeploy). |
| Still occasional slow first request | Confirm the cron-job is enabled and hitting `/health` every ≤10 min. |
