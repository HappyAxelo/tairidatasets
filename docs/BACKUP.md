# Backup & Restore Guide

Two things must be backed up: the **PostgreSQL database** (metadata, users, requests) and
the **file storage** (the actual dataset files).

## Database backup

### One-off

```bash
docker compose exec -T db pg_dump -U tairi tairi_datahub | gzip > backup_$(date +%F).sql.gz
```

### Restore

```bash
gunzip -c backup_2026-01-01.sql.gz | docker compose exec -T db psql -U tairi -d tairi_datahub
```

> To restore into a clean database, first drop and recreate it, or bring the stack up with a
> fresh `pgdata` volume before importing.

## File storage backup

### Local storage (default)

The files live in the `storage` Docker volume mounted at `/app/storage` in the backend.

```bash
# Archive the storage volume
docker run --rm -v tairidatasets_storage:/data -v $(pwd):/backup alpine \
  tar czf /backup/storage_$(date +%F).tar.gz -C /data .
```

Restore:

```bash
docker run --rm -v tairidatasets_storage:/data -v $(pwd):/backup alpine \
  sh -c "cd /data && tar xzf /backup/storage_2026-01-01.tar.gz"
```

### MinIO / S3 storage

Use the object store's native tooling, e.g.:

```bash
mc mirror minio/tairi-datasets ./s3-backup/
```

## Automated daily backups (cron)

Create `/etc/cron.daily/tairi-backup`:

```bash
#!/usr/bin/env bash
set -e
BACKUP_DIR=/var/backups/tairi
mkdir -p "$BACKUP_DIR"
cd /opt/tairidatasets   # path to the deployment

# Database
docker compose exec -T db pg_dump -U tairi tairi_datahub | gzip \
  > "$BACKUP_DIR/db_$(date +%F).sql.gz"

# Storage
docker run --rm -v tairidatasets_storage:/data -v "$BACKUP_DIR":/backup alpine \
  tar czf "/backup/storage_$(date +%F).tar.gz" -C /data .

# Retain 14 days
find "$BACKUP_DIR" -name '*.gz' -mtime +14 -delete
```

```bash
sudo chmod +x /etc/cron.daily/tairi-backup
```

## Disaster recovery drill

Periodically verify a backup restores cleanly into a throwaway stack:

1. `docker compose -p tairi_dr up -d db`
2. Import the latest DB dump.
3. Import the latest storage archive into a test volume.
4. Confirm dataset pages load and files download.

Store at least one recent backup **off-server** (institutional backup system or secure
object storage).
