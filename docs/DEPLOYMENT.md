# Deployment Guide — University of Rwanda Server

This guide describes deploying TAIRI DataHub on an Ubuntu Linux server using Docker.

## 1. Server requirements

- Ubuntu 22.04 LTS or newer
- 4+ CPU cores, 8 GB+ RAM (more for large dataset workloads)
- Sufficient disk for datasets (mount a dedicated volume for `/var/lib/docker/volumes`)
- Ports 80 (and 443 for TLS) open to intended users
- A DNS record, e.g. `datahub.ur.ac.rw`, pointing at the server

## 2. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in to take effect
```

## 3. Get the code

```bash
git clone https://github.com/HappyAxelo/tairidatasets.git
cd tairidatasets
cp .env.example .env
```

## 4. Configure `.env`

Edit `.env` and set, at minimum:

```bash
POSTGRES_PASSWORD=<a strong password>
SECRET_KEY=$(openssl rand -hex 32)
FRONTEND_URL=https://datahub.ur.ac.rw
BACKEND_CORS_ORIGINS=https://datahub.ur.ac.rw
SUPERADMIN_EMAILS=admin1@ur.ac.rw,admin2@ur.ac.rw,admin3@ur.ac.rw
SUPERADMIN_DEFAULT_PASSWORD=<a strong temporary password>
# SMTP settings for real email delivery
SMTP_HOST=smtp.ur.ac.rw
SMTP_USER=...
SMTP_PASSWORD=...
```

## 5. Launch

```bash
docker compose up -d --build
docker compose ps          # all services healthy
docker compose logs -f backend
```

Visit `http://<server-ip>/` to confirm. Sign in as a super admin and immediately
change the seeded passwords (Profile → Change password) and via the admin console.

## 6. Enable HTTPS (recommended)

Obtain certificates (Let's Encrypt via certbot, or the UR institutional CA):

```bash
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d datahub.ur.ac.rw
```

Copy the certs into `infrastructure/nginx/certs/` (`fullchain.pem`, `privkey.pem`),
uncomment the `443` server block in `infrastructure/nginx/nginx.conf` and the
`443` port + certs volume in `docker-compose.yml`, then:

```bash
docker compose up -d nginx
```

## 7. Switching to MinIO / S3 storage (optional)

No code changes are required. In `.env`:

```bash
STORAGE_BACKEND=s3
S3_ENDPOINT_URL=https://minio.ur.ac.rw
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=tairi-datasets
```

Recreate the backend: `docker compose up -d --build backend`.

## 8. Upgrades

```bash
git pull
docker compose up -d --build
```

Seeding is idempotent, so existing data is preserved. For schema changes across
releases, review [BACKUP.md](BACKUP.md) and back up before upgrading.

## 9. Operations checklist

- [ ] Seeded passwords changed
- [ ] `SECRET_KEY` is a unique random value
- [ ] HTTPS enabled
- [ ] SMTP configured and test email received
- [ ] Automated database backups scheduled (see [BACKUP.md](BACKUP.md))
- [ ] Disk usage monitored for the `storage` and `pgdata` volumes
