"""Super-administrator endpoints: users, approvals, analytics, logs."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import client_ip, require_super_admin
from app.core.security import generate_url_safe_token, hash_password
from app.models.access import AccessRequest, Download
from app.models.dataset import Dataset, DatasetVersion, File
from app.models.enums import (
    AccessRequestStatus,
    DatasetStatus,
    NotificationType,
    RoleName,
    UserStatus,
)
from app.models.system import Announcement, AuditLog
from app.models.taxonomy import ResearchArea
from app.models.user import Role, User
from app.schemas.access import AccessRequestRead
from app.schemas.admin import (
    AdminOverview,
    AnnouncementCreate,
    AuditLogRead,
    DownloadLogRead,
    NamedCount,
    RoleChange,
    StatCards,
    TimeseriesPoint,
)
from app.schemas.common import Message
from app.schemas.user import UserAdminCreate, UserRead
from app.services import email as email_service
from app.services.notifications import create_notification, write_audit
from app.services.storage import get_storage

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_super_admin)])


# --------------------------------------------------------------------------- #
# Analytics
# --------------------------------------------------------------------------- #
@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)):
    cards = StatCards(
        datasets=db.scalar(select(func.count(Dataset.id)).where(Dataset.is_deleted.is_(False))) or 0,
        users=db.scalar(select(func.count(User.id))) or 0,
        downloads=db.scalar(select(func.count(Download.id))) or 0,
        storage_bytes=int(db.scalar(select(func.coalesce(func.sum(Dataset.total_size_bytes), 0))) or 0),
        pending_requests=db.scalar(
            select(func.count(AccessRequest.id)).where(
                AccessRequest.status == AccessRequestStatus.PENDING
            )
        ) or 0,
        pending_datasets=db.scalar(
            select(func.count(Dataset.id)).where(
                Dataset.status == DatasetStatus.PENDING_APPROVAL
            )
        ) or 0,
    )

    # Monthly uploads for the last 6 months.
    monthly: list[TimeseriesPoint] = []
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        nxt = (month_start + timedelta(days=32)).replace(day=1)
        count = db.scalar(
            select(func.count(Dataset.id)).where(
                Dataset.created_at >= month_start, Dataset.created_at < nxt
            )
        )
        monthly.append(TimeseriesPoint(label=month_start.strftime("%b"), value=int(count or 0)))

    top = db.execute(
        select(Dataset.title, Dataset.download_count)
        .where(Dataset.is_deleted.is_(False))
        .order_by(Dataset.download_count.desc())
        .limit(6)
    ).all()
    top_datasets = [NamedCount(name=t[0], value=int(t[1])) for t in top]

    areas = db.execute(
        select(ResearchArea.name, func.count(Dataset.id))
        .join(Dataset, Dataset.research_area_id == ResearchArea.id)
        .where(Dataset.is_deleted.is_(False))
        .group_by(ResearchArea.name)
        .order_by(func.count(Dataset.id).desc())
        .limit(8)
    ).all()
    research_areas = [NamedCount(name=a[0], value=int(a[1])) for a in areas]

    storage_rows = db.execute(
        select(ResearchArea.name, func.coalesce(func.sum(Dataset.total_size_bytes), 0))
        .join(Dataset, Dataset.research_area_id == ResearchArea.id)
        .where(Dataset.is_deleted.is_(False))
        .group_by(ResearchArea.name)
        .order_by(func.sum(Dataset.total_size_bytes).desc())
        .limit(8)
    ).all()
    storage_by_area = [NamedCount(name=s[0], value=int(s[1])) for s in storage_rows]

    return AdminOverview(
        cards=cards,
        monthly_uploads=monthly,
        top_datasets=top_datasets,
        research_areas=research_areas,
        storage_by_area=storage_by_area,
    )


# --------------------------------------------------------------------------- #
# User management
# --------------------------------------------------------------------------- #
@router.get("/users", response_model=List[UserRead])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.created_at.desc())).unique().all()


@router.post("/users", response_model=UserRead, status_code=201)
def create_user(
    payload: UserAdminCreate, request: Request, db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    if db.scalar(select(User).where((User.email == payload.email) | (User.username == payload.username))):
        raise HTTPException(status_code=409, detail="Email or username already exists")
    role = db.scalar(select(Role).where(Role.name == payload.role.value))
    if payload.role == RoleName.SUPER_ADMIN:
        count = db.scalar(select(func.count(User.id)).join(Role).where(Role.name == RoleName.SUPER_ADMIN.value))
        if (count or 0) >= 3:
            raise HTTPException(status_code=400, detail="Maximum of 3 super administrators allowed")
    user = User(
        email=payload.email, username=payload.username, full_name=payload.full_name,
        affiliation=payload.affiliation, department_id=payload.department_id,
        hashed_password=hash_password(payload.password), role_id=role.id,
        status=UserStatus.ACTIVE, is_email_verified=True,
    )
    db.add(user)
    write_audit(db, actor_id=admin.id, action="admin.create_user",
                entity_type="user", ip_address=client_ip(request))
    db.commit()
    db.refresh(user)
    email_service.send_account_created(user.email, user.username, payload.password)
    return user


@router.post("/users/{user_id}/suspend", response_model=Message)
def suspend_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_super_admin:
        raise HTTPException(status_code=400, detail="Cannot suspend a super administrator")
    user.status = UserStatus.SUSPENDED
    write_audit(db, actor_id=admin.id, action="admin.suspend_user", entity_type="user", entity_id=user_id)
    db.commit()
    return Message(detail="User suspended")


@router.post("/users/{user_id}/activate", response_model=Message)
def activate_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = UserStatus.ACTIVE
    db.commit()
    return Message(detail="User activated")


@router.delete("/users/{user_id}", response_model=Message)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_super_admin:
        raise HTTPException(status_code=400, detail="Cannot delete a super administrator")
    db.delete(user)
    write_audit(db, actor_id=admin.id, action="admin.delete_user", entity_type="user", entity_id=user_id)
    db.commit()
    return Message(detail="User deleted")


@router.post("/users/{user_id}/role", response_model=UserRead)
def change_role(user_id: int, payload: RoleChange, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = db.scalar(select(Role).where(Role.name == payload.role))
    if not role:
        raise HTTPException(status_code=400, detail="Unknown role")
    user.role_id = role.id
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password", response_model=Message)
def admin_reset_password(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = generate_url_safe_token()
    user.password_reset_token = token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()
    email_service.send_password_reset(user.email, token)
    return Message(detail="Password reset email sent")


# --------------------------------------------------------------------------- #
# Dataset moderation
# --------------------------------------------------------------------------- #
@router.get("/datasets/pending", response_model=List[dict])
def pending_datasets(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Dataset).where(Dataset.status == DatasetStatus.PENDING_APPROVAL)
        .order_by(Dataset.created_at.asc())
    ).unique().all()
    return [
        {"id": d.id, "slug": d.slug, "title": d.title, "owner": d.owner.username,
         "created_at": d.created_at.isoformat()}
        for d in rows
    ]


@router.post("/datasets/{dataset_id}/approve", response_model=Message)
def approve_dataset(dataset_id: int, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    dataset.status = DatasetStatus.APPROVED
    dataset.approved_at = datetime.now(timezone.utc)
    create_notification(db, user_id=dataset.owner_id, type=NotificationType.DATASET_APPROVED,
                        title="Dataset approved", body=f"{dataset.title} is now public",
                        link=f"/datasets/{dataset.slug}")
    write_audit(db, actor_id=admin.id, action="admin.approve_dataset", entity_type="dataset", entity_id=dataset_id)
    db.commit()
    return Message(detail="Dataset approved")


@router.post("/datasets/{dataset_id}/reject", response_model=Message)
def reject_dataset(dataset_id: int, payload: dict, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    dataset.status = DatasetStatus.REJECTED
    dataset.rejection_reason = payload.get("reason")
    create_notification(db, user_id=dataset.owner_id, type=NotificationType.DATASET_REJECTED,
                        title="Dataset rejected",
                        body=payload.get("reason") or f"{dataset.title} was rejected",
                        link=f"/datasets/{dataset.slug}")
    write_audit(db, actor_id=admin.id, action="admin.reject_dataset", entity_type="dataset", entity_id=dataset_id)
    db.commit()
    return Message(detail="Dataset rejected")


@router.post("/datasets/{dataset_id}/restore", response_model=Message)
def restore_dataset(dataset_id: int, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    dataset.is_deleted = False
    dataset.status = DatasetStatus.APPROVED
    write_audit(db, actor_id=admin.id, action="admin.restore_dataset", entity_type="dataset", entity_id=dataset_id)
    db.commit()
    return Message(detail="Dataset restored")


@router.get("/datasets", response_model=List[dict])
def list_all_datasets(include_deleted: bool = True, db: Session = Depends(get_db)):
    """Every dataset for the admin management table, newest first."""
    stmt = select(Dataset).order_by(Dataset.created_at.desc())
    if not include_deleted:
        stmt = stmt.where(Dataset.is_deleted.is_(False))
    rows = db.scalars(stmt.limit(500)).unique().all()
    return [
        {
            "id": d.id,
            "slug": d.slug,
            "title": d.title,
            "owner": d.owner.username if d.owner else None,
            "status": d.status.value,
            "is_deleted": d.is_deleted,
            "visibility": d.visibility.value,
            "download_count": d.download_count,
            "file_count": d.file_count,
            "created_at": d.created_at.isoformat(),
        }
        for d in rows
    ]


@router.delete("/datasets/{dataset_id}", response_model=Message)
def delete_dataset_admin(
    dataset_id: int,
    permanent: bool = False,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """Delete a dataset from the admin console.

    By default this is a soft delete (recoverable via *restore*). Passing
    ``permanent=true`` hard-deletes the dataset: its stored file objects are
    removed and the row is dropped (cascading to versions, files, requests,
    downloads, etc.). Permanent deletion cannot be undone.
    """
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if permanent:
        title = dataset.title
        storage = get_storage()
        files = db.scalars(
            select(File)
            .join(DatasetVersion, File.version_id == DatasetVersion.id)
            .where(DatasetVersion.dataset_id == dataset_id)
        ).all()
        for f in files:
            try:
                storage.delete(f.storage_key)
            except Exception:  # pragma: no cover - best effort cleanup
                pass
        db.delete(dataset)
        write_audit(db, actor_id=admin.id, action="admin.delete_dataset_permanent",
                    entity_type="dataset", entity_id=dataset_id, detail=title)
        db.commit()
        return Message(detail="Dataset permanently deleted")

    dataset.is_deleted = True
    dataset.status = DatasetStatus.DELETED
    write_audit(db, actor_id=admin.id, action="admin.delete_dataset",
                entity_type="dataset", entity_id=dataset_id)
    db.commit()
    return Message(detail="Dataset deleted (recoverable via restore)")


# --------------------------------------------------------------------------- #
# Logs & announcements
# --------------------------------------------------------------------------- #
@router.get("/requests", response_model=List[AccessRequestRead])
def all_access_requests(status: str | None = None, db: Session = Depends(get_db)):
    """List every access request across the platform (optionally filtered)."""
    stmt = select(AccessRequest).order_by(AccessRequest.created_at.desc())
    if status:
        stmt = stmt.where(AccessRequest.status == status)
    return db.scalars(stmt.limit(300)).unique().all()


@router.get("/audit-logs", response_model=List[AuditLogRead])
def audit_logs(limit: int = 200, db: Session = Depends(get_db)):
    return db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)).all()


@router.get("/downloads", response_model=List[DownloadLogRead])
def download_logs(limit: int = 200, db: Session = Depends(get_db)):
    return db.scalars(select(Download).order_by(Download.created_at.desc()).limit(limit)).all()


@router.post("/announcements", response_model=Message, status_code=201)
def create_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db), admin: User = Depends(require_super_admin)):
    db.add(Announcement(title=payload.title, body=payload.body, created_by_id=admin.id))
    db.commit()
    return Message(detail="Announcement published")
