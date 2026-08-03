# Entity–Relationship Diagram

The normalized PostgreSQL schema. The full DDL is generated to
[`database/schema.sql`](../database/schema.sql).

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    ROLES }o--o{ PERMISSIONS : "grants"
    DEPARTMENTS ||--o{ USERS : "affiliated"
    DEPARTMENTS ||--o{ DATASETS : "classifies"
    RESEARCH_AREAS ||--o{ DATASETS : "classifies"
    CATEGORIES ||--o{ DATASETS : "classifies"
    LICENSES ||--o{ DATASETS : "licensed under"
    USERS ||--o{ DATASETS : "owns"
    DATASETS }o--o{ TAGS : "tagged"
    DATASETS ||--o{ DATASET_VERSIONS : "has"
    DATASET_VERSIONS ||--o{ FILES : "contains"
    DATASETS ||--o{ ACCESS_REQUESTS : "receives"
    USERS ||--o{ ACCESS_REQUESTS : "makes"
    DATASETS ||--o{ DOWNLOADS : "downloaded"
    USERS ||--o{ DOWNLOADS : "by"
    DATASETS ||--o{ VIEWS : "viewed"
    DATASETS ||--o{ COMMENTS : "discussed"
    USERS ||--o{ COMMENTS : "writes"
    DATASETS ||--o{ FAVORITES : "bookmarked"
    USERS ||--o{ FAVORITES : "by"
    DATASETS ||--o{ CITATIONS : "cited"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "acts"

    USERS {
        int id PK
        string username UK
        string email UK
        string hashed_password
        int role_id FK
        int department_id FK
        enum status
        bool is_email_verified
        datetime created_at
    }
    ROLES {
        int id PK
        string name UK
        string description
    }
    PERMISSIONS {
        int id PK
        string code UK
    }
    DATASETS {
        int id PK
        string slug UK
        string title
        text description
        int owner_id FK
        int research_area_id FK
        int category_id FK
        int license_id FK
        int department_id FK
        enum visibility
        enum status
        int download_count
        int view_count
        bigint total_size_bytes
        bool is_deleted
        datetime created_at
    }
    DATASET_VERSIONS {
        int id PK
        int dataset_id FK
        string version
        text changelog
        bool is_current
        bigint total_size_bytes
    }
    FILES {
        int id PK
        int version_id FK
        string filename
        string storage_key
        bigint size_bytes
        string checksum_sha256
        string virus_scan_status
    }
    ACCESS_REQUESTS {
        int id PK
        int dataset_id FK
        int requester_id FK
        text purpose
        enum status
        enum access_level
        enum grant_duration
        datetime expires_at
    }
    DOWNLOADS {
        int id PK
        int dataset_id FK
        int file_id FK
        int user_id FK
        string ip_address
        datetime created_at
    }
    NOTIFICATIONS {
        int id PK
        int user_id FK
        enum type
        string title
        bool is_read
    }
    AUDIT_LOGS {
        int id PK
        int actor_id FK
        string action
        string entity_type
        int entity_id
        string ip_address
    }
```

## Key design decisions

- **Soft deletes** — datasets carry `is_deleted` + a `deleted` status so super admins
  can restore them; nothing is destroyed on user delete.
- **Versioning** — every dataset has one or more `dataset_versions`; files belong to a
  version, so historical versions remain fully accessible.
- **RBAC** — `roles ↔ permissions` is many-to-many, allowing capabilities to be tuned
  without code changes.
- **Denormalized counters** on `datasets` avoid expensive aggregate queries on listings.
- **Audit trail** — every privileged action is written to `audit_logs` with actor and IP.
