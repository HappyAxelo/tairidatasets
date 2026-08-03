# Administrator Manual

For the three Super Administrators of TAIRI DataHub. The admin console is at **/admin**.

## First-run checklist

1. Sign in with a seeded super-admin account (`admin1@tairi.ur.ac.rw` / `ChangeMe#2026`).
2. **Change your password** immediately (Profile → Change password).
3. Reset or recreate the other admin passwords.
4. Create the initial student researcher accounts.
5. Verify SMTP is configured (a real approval email should arrive).

## Analytics (/admin)

The dashboard shows platform-wide cards — datasets, users, downloads, storage, pending
requests, pending datasets — plus charts for monthly uploads, datasets by research area,
most downloaded datasets and storage by area.

## User management (/admin/users)

- **New user** — create student researchers, researchers or additional super admins.
  A welcome email with the temporary password is sent automatically.
  > The platform enforces a maximum of **3** super administrators.
- **Reset password** (key icon) — emails the user a reset link.
- **Suspend / Activate** — a suspended user cannot sign in; their content remains.
- **Delete** — permanently removes the user account (their datasets are retained/soft-deleted).

## Dataset moderation (/admin/datasets)

Newly uploaded datasets are **pending approval**. Review each and **Approve** (makes it
publicly discoverable) or **Reject** (with an optional reason sent to the owner). Deleted
datasets can be restored via the API/admin actions.

## Access requests (/admin/requests)

View every access request across the platform, filterable by status. As a super admin you
can also decide any request from the dataset's owner view if delegated.

## Audit logs (/admin/logs)

A chronological, immutable-by-convention record of privileged and user actions: logins,
uploads, downloads, approvals, user management — each with the actor and source IP.

## Announcements

Publish platform-wide announcements via `POST /api/v1/admin/announcements` (surfaced to
users). Useful for maintenance windows or new-feature notices.

## Storage & backups

- Uploaded files live in the `storage` Docker volume (or MinIO/S3 when configured).
- Schedule regular backups of the PostgreSQL database and the storage volume — see
  [BACKUP.md](BACKUP.md).

## Security responsibilities

- Keep `SECRET_KEY` secret and unique per environment.
- Enforce HTTPS in production.
- Review audit logs periodically.
- Rotate admin passwords and remove departed users promptly.
- Ensure uploaders have rights/consent for the data they publish (see Terms).
