"""Enumerated types used across the domain model."""
from __future__ import annotations

import enum


class RoleName(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    STUDENT_RESEARCHER = "student_researcher"
    RESEARCHER = "researcher"
    GUEST = "guest"  # Reserved; guests are unauthenticated and have no row.


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class Visibility(str, enum.Enum):
    PRIVATE = "private"
    PUBLIC_METADATA = "public_metadata"
    RESTRICTED = "restricted"
    PUBLIC = "public"


class DatasetStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    DELETED = "deleted"  # Soft delete; restorable by super admin.


class AccessRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MORE_INFO_REQUESTED = "more_info_requested"
    REVOKED = "revoked"


class AccessLevel(str, enum.Enum):
    VIEW_ONLY = "view_only"
    DOWNLOAD = "download"
    DOWNLOAD_API = "download_api"


class GrantDuration(str, enum.Enum):
    TIME_LIMITED = "time_limited"
    PERMANENT = "permanent"


class NotificationType(str, enum.Enum):
    ACCESS_REQUESTED = "access_requested"
    ACCESS_APPROVED = "access_approved"
    ACCESS_REJECTED = "access_rejected"
    MORE_INFO_REQUESTED = "more_info_requested"
    DATASET_APPROVED = "dataset_approved"
    DATASET_REJECTED = "dataset_rejected"
    DATASET_UPDATED = "dataset_updated"
    NEW_DOWNLOAD = "new_download"
    NEW_COMMENT = "new_comment"
    ANNOUNCEMENT = "announcement"
