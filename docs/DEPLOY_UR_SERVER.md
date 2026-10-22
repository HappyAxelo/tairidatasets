# Deploying to https://aceiot.ur.ac.rw/datahub (auto-deploy from GitHub)

This guide puts TAIRI DataHub on the UR Linux server under the `/datahub`
sub-folder of the existing `aceiot.ur.ac.rw` site, and sets up GitHub Actions
so that **every push to `main` that passes CI is deployed automatically**.

```
git push ──► CI (tests + build) ──► Deploy workflow ──► runner on the server
                                                               git pull
                                                               docker compose -f docker-compose.prod.yml up -d --build

Browser ──► https://aceiot.ur.ac.rw/datahub ──► main web server (TLS)
                                                   └─► 127.0.0.1:8080  (Docker nginx)
                                                          ├─ /datahub/api/* ─► FastAPI backend ─► PostgreSQL
                                                          └─ /datahub/*     ─► Next.js frontend
```

Commands below assume Ubuntu and a user with `sudo`.

---

## 1. Install Docker and Git (once)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo apt install -y git
```

Log out and SSH back in, then check: `docker compose version`.

## 2. Get the code onto the server (once)

```bash
sudo mkdir -p /opt/tairidatasets
sudo chown $USER:$USER /opt/tairidatasets
git clone https://github.com/HappyAxelo/tairidatasets.git /opt/tairidatasets
```

> If the repository is private: run `ssh-keygen -t ed25519 -f ~/.ssh/repo_key -N ""`,
> add `~/.ssh/repo_key.pub` under GitHub → repo → Settings → **Deploy keys**,
> then clone with `git@github.com:HappyAxelo/tairidatasets.git`.

## 3. Create the secrets file (once)

```bash
cd /opt/tairidatasets
cp .env.example .env
nano .env
```

Set at least:

| Variable | Value |
|---|---|
| `POSTGRES_PASSWORD` | a long random password |
| `SECRET_KEY` | output of `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://aceiot.ur.ac.rw/datahub` |
| `BACKEND_CORS_ORIGINS` | `https://aceiot.ur.ac.rw` |
| `SUPERADMIN_EMAILS` | the three real admin emails |
| `SUPERADMIN_DEFAULT_PASSWORD` | a strong password (change it after first login) |
| `SMTP_*` | the UR mail server, so verification/reset emails are sent |

`.env` is in `.gitignore` and must never be committed.

## 4. First start (once)

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps        # all services "Up"
curl -I http://127.0.0.1:8080/datahub              # expect HTTP 200
```

The backend creates the tables and super-admin accounts on its first boot.

## 5. Publish it at /datahub on the main web server (once)

Find the config that serves `aceiot.ur.ac.rw`:

```bash
sudo grep -rl "aceiot.ur.ac.rw" /etc/nginx/ /etc/apache2/ 2>/dev/null
```

**If it is Nginx:** paste the contents of
[`infrastructure/nginx/host-datahub.conf`](../infrastructure/nginx/host-datahub.conf)
inside the `server { listen 443 ... }` block, then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**If it is Apache:** enable the proxy modules and add this inside the
`<VirtualHost *:443>` block:

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel headers rewrite
```

```apache
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
RewriteEngine On
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule ^/datahub/(.*) ws://127.0.0.1:8080/datahub/$1 [P,L]
ProxyPass        /datahub http://127.0.0.1:8080/datahub
ProxyPassReverse /datahub http://127.0.0.1:8080/datahub
LimitRequestBody 0
```

```bash
sudo apachectl configtest && sudo systemctl reload apache2
```

Open **https://aceiot.ur.ac.rw/datahub** — the site should load.

## 6. Install the GitHub runner on the server (once)

The university firewall blocks GitHub from connecting to the server over SSH,
so deploys run on a **self-hosted runner**: a small GitHub program on the
server that connects *out* to GitHub and picks up deploy jobs.

First let the `aceiot` user run Docker and own the code (log out and back in
afterwards):

```bash
sudo usermod -aG docker aceiot
sudo chown -R aceiot:aceiot /opt/tairidatasets
```

Then in GitHub → repo → Settings → Actions → Runners → **New self-hosted
runner** → Linux / x64. Run the **Download** and **Configure** commands it
shows, as `aceiot`, in `~/actions-runner`. When `config.sh` asks:

| Question | Answer |
|---|---|
| runner group | press Enter |
| name of runner | `ur-server` |
| additional labels | `ur-server` |
| work folder | press Enter |

Install it as a service so it survives reboots:

```bash
cd ~/actions-runner
sudo ./svc.sh install aceiot
sudo ./svc.sh start
```

The runner should now show as **Idle** (green) on the Runners page.

> **Security (public repository):** a self-hosted runner executes workflow
> code on the server. In GitHub → Settings → Actions → General → "Approval
> for running fork pull request workflows from contributors", choose
> **Require approval for all external contributors**, and never approve a
> fork pull request that changes files in `.github/workflows/`.

## 7. Test auto-deploy

Push any small change to `main`. In GitHub → **Actions** you will see **CI**
run, then **Deploy**. When Deploy is green, refresh the site.
You can also start a deploy by hand: Actions → Deploy → **Run workflow**.

If Deploy stays "Queued", the runner is offline: `sudo ./svc.sh status` in
`~/actions-runner`, and `sudo ./svc.sh start` to start it.

---

## Day-to-day

| Task | Command (in `/opt/tairidatasets`) |
|---|---|
| See logs | `docker compose -f docker-compose.prod.yml logs -f --tail=100` |
| Restart everything | `docker compose -f docker-compose.prod.yml restart` |
| Database shell | `docker compose -f docker-compose.prod.yml exec db psql -U tairi tairi_datahub` |
| Backup database | `docker compose -f docker-compose.prod.yml exec -T db pg_dump -U tairi tairi_datahub > ~/backup_$(date +%F).sql` |

Schedule the backup daily with `crontab -e` — see [BACKUP.md](BACKUP.md).
Uploaded files live in the `storage` Docker volume; back that up too.

**Database changes:** tables are created with SQLAlchemy `create_all`, which
adds *new* tables automatically but does **not** change existing ones. If you
add or rename a column on an existing model, apply that change to the
production database by hand (`ALTER TABLE ...`) before deploying.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| 502 Bad Gateway | Stack not running: `docker compose -f docker-compose.prod.yml ps`, then check logs |
| Page loads without styling / images 404 | Frontend built without the base path — confirm `BASE_PATH=/datahub` in `.env` and rebuild |
| API calls go to `aceiot.ur.ac.rw/api/...` | Same as above (base path is baked in at build time) |
| Upload fails with 413 | Raise `client_max_body_size` (Nginx) on the main web server |
| Verification/reset email links point to localhost | `FRONTEND_URL` in `.env` is wrong; fix and `up -d` again |
| `set POSTGRES_PASSWORD in .env` error | `.env` missing or incomplete (step 3) |
