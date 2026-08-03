"""Dataset domain services: slug generation, tag resolution, permissions."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.access import AccessRequest
from app.models.dataset import Dataset, File
from app.models.enums import (
    AccessLevel,
    AccessRequestStatus,
    DatasetStatus,
    Visibility,
)
from app.models.taxonomy import Tag
from app.models.user import User
from app.utils import slugify


def unique_slug(db: Session, title: str) -> str:
    base = slugify(title)
    slug = base
    i = 2
    while db.scalar(select(Dataset.id).where(Dataset.slug == slug)):
        slug = f"{base}-{i}"
        i += 1
    return slug


def resolve_tags(db: Session, names: list[str]) -> list[Tag]:
    tags: list[Tag] = []
    for name in {n.strip() for n in names if n.strip()}:
        slug = slugify(name)
        tag = db.scalar(select(Tag).where(Tag.slug == slug))
        if not tag:
            tag = Tag(name=name, slug=slug)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def recalc_counters(db: Session, dataset: Dataset) -> None:
    """Recompute denormalised size/file counters from current version files."""
    version = dataset.latest_version
    if not version:
        dataset.file_count = 0
        dataset.total_size_bytes = 0
        return
    size = db.scalar(
        select(func.coalesce(func.sum(File.size_bytes), 0)).where(
            File.version_id == version.id
        )
    )
    count = db.scalar(
        select(func.count(File.id)).where(File.version_id == version.id)
    )
    dataset.total_size_bytes = int(size or 0)
    dataset.file_count = int(count or 0)


def has_download_access(db: Session, dataset: Dataset, user: Optional[User]) -> bool:
    """Determine whether ``user`` may download files of ``dataset``.

    Rules:
      * Guests (no user) can never download.
      * The owner and super admins always can.
      * Fully public datasets are downloadable by any authenticated user.
      * Otherwise an approved, active access request granting DOWNLOAD (or
        DOWNLOAD_API) is required.
    """
    if user is None:
        return False
    if user.is_super_admin or dataset.owner_id == user.id:
        return True
    if dataset.visibility == Visibility.PUBLIC:
        return True

    grant = db.scalar(
        select(AccessRequest).where(
            AccessRequest.dataset_id == dataset.id,
            AccessRequest.requester_id == user.id,
            AccessRequest.status == AccessRequestStatus.APPROVED,
        )
    )
    if not grant:
        return False
    if grant.access_level == AccessLevel.VIEW_ONLY:
        return False
    if grant.expires_at and grant.expires_at < datetime.now(timezone.utc):
        return False
    return True


def can_view_dataset(dataset: Dataset, user: Optional[User]) -> bool:
    """Whether metadata of ``dataset`` is visible to ``user`` (or guest)."""
    if dataset.is_deleted or dataset.status == DatasetStatus.DELETED:
        return bool(user and user.is_super_admin)
    if user and (user.is_super_admin or dataset.owner_id == user.id):
        return True
    if dataset.status != DatasetStatus.APPROVED:
        return False
    # Approved datasets: private hides metadata from everyone but owner/admin.
    return dataset.visibility != Visibility.PRIVATE
