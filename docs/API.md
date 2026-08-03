# API Reference

Base URL: `/api/v1`. Interactive Swagger UI is served at `/docs` and ReDoc at `/redoc`;
the OpenAPI schema is at `/openapi.json`.

Authenticate by sending `Authorization: Bearer <access_token>` obtained from the login
endpoints. Access tokens are short-lived; use `/auth/refresh` with the refresh token to
obtain a new pair.

## Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Self-register as a researcher | — |
| POST | `/auth/login` | OAuth2 form login (`username` = email) | — |
| POST | `/auth/login/json` | JSON login for the SPA | — |
| POST | `/auth/refresh` | Exchange refresh token for a new pair | — |
| POST | `/auth/verify-email` | Verify email with token | — |
| POST | `/auth/forgot-password` | Request a reset link | — |
| POST | `/auth/reset-password` | Reset password with token | — |
| POST | `/auth/change-password` | Change password | ✅ |
| GET | `/auth/me` | Current user | ✅ |

## Users

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/users/me` | Profile | ✅ |
| PATCH | `/users/me` | Update profile | ✅ |
| GET | `/users/me/favorites` | Favorited datasets | ✅ |
| GET | `/users/me/recently-viewed` | Recently viewed datasets | ✅ |

## Datasets

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/datasets` | Browse/search (filters: `q`, `research_area_id`, `license_id`, `file_type`, `year`, `sort`, `page`) | optional |
| GET | `/datasets/mine` | My datasets | ✅ |
| GET | `/datasets/{slug}` | Dataset detail (records a view) | optional |
| POST | `/datasets` | Create dataset (v1.0) | uploader |
| PATCH | `/datasets/{id}` | Update metadata | owner |
| DELETE | `/datasets/{id}` | Soft-delete | owner |
| POST | `/datasets/{id}/versions` | Create a new version | owner |
| POST | `/datasets/{id}/files` | Upload files (multipart) | uploader |
| GET | `/datasets/{id}/files/{fid}/download` | Download a file | ✅ + access |
| POST | `/datasets/{id}/favorite` | Toggle favorite | ✅ |
| GET/POST | `/datasets/{id}/comments` | List/add comments | ✅ (post) |

## Access requests

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/access-requests/datasets/{id}` | Request access | ✅ |
| GET | `/access-requests/incoming` | Requests to my datasets | ✅ |
| GET | `/access-requests/outgoing` | My requests | ✅ |
| POST | `/access-requests/{id}/decide` | Approve/reject | owner |
| POST | `/access-requests/{id}/more-info` | Ask for more info | owner |

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Unread count |
| POST | `/notifications/{id}/read` | Mark one read |
| POST | `/notifications/read-all` | Mark all read |
| WS | `/notifications/ws?token=<jwt>` | Real-time channel |

## Citations & taxonomy

| Method | Path | Description |
|--------|------|-------------|
| GET | `/citations/{slug}` | APA / IEEE / BibTeX strings |
| GET | `/citations/{slug}/bibtex` | Download `.bib` |
| GET | `/taxonomy/research-areas` `/categories` `/licenses` `/departments` `/tags` | Lookup lists |

## Admin (super administrator only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/overview` | Analytics cards + charts |
| GET/POST | `/admin/users` | List / create users |
| POST | `/admin/users/{id}/suspend` · `/activate` · `/reset-password` · `/role` | User management |
| DELETE | `/admin/users/{id}` | Delete user |
| GET | `/admin/datasets/pending` | Datasets awaiting approval |
| POST | `/admin/datasets/{id}/approve` · `/reject` · `/restore` | Moderation |
| GET | `/admin/requests` | All access requests |
| GET | `/admin/audit-logs` · `/downloads` | Logs |
| POST | `/admin/announcements` | Publish announcement |

## Example

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost/api/v1/auth/login/json \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin1@tairi.ur.ac.rw","password":"ChangeMe#2026"}' | jq -r .access_token)

# List datasets
curl -s http://localhost/api/v1/datasets | jq '.total'

# Create a dataset
curl -s -X POST http://localhost/api/v1/datasets \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"My Dataset","visibility":"restricted","tags":["demo"]}'
```
