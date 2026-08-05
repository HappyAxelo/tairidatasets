"""Dataset endpoints: browse, search, CRUD, upload, versioning, download."""
from __future__ import annotations

import io
from datetime import datetime, timezone
from math import ceil
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File as UploadFileField,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import String, and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.deps import (
    client_ip,
    get_current_user,
    get_optional_user,
    require_uploader,
)
from app.models.access import Download, View
from app.models.dataset import Dataset, DatasetVersion, File as FileModel
from app.models.enums import DatasetStatus, NotificationType, Visibility
from app.models.social import Comment, Favorite
from app.models.taxonomy import Tag, dataset_tags
from app.models.user import User
from app.schemas.access import CommentCreate, CommentRead
from app.schemas.common import Message, Page
from app.schemas.dataset import (
    DatasetCreate,
    DatasetDetail,
    DatasetListItem,
    DatasetUpdate,
    DatasetVersionRead,
    FileRead,
)
from app.services import datasets as ds
from app.services.notifications import create_notification, write_audit
from app.services.storage import get_storage

router = APIRouter(prefix="/datasets", tags=["Datasets"])


# --------------------------------------------------------------------------- #
# Listing & search
# --------------------------------------------------------------------------- #
SORT_MAP = {
    "newest": Dataset.created_at.desc(),
    "oldest": Dataset.created_at.asc(),
    "downloads": Dataset.download_count.desc(),
    "views": Dataset.view_count.desc(),
    "alphabetical": Dataset.title.asc(),
}


@router.get("", response_model=Page[DatasetListItem])
def list_datasets(
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
    q: Optional[str] = Query(None, description="Full-text search across title, description, keywords, authors"),
    research_area_id: Optional[int] = None,
    category_id: Optional[int] = None,
    department_id: Optional[int] = None,
    license_id: Optional[int] = None,
    tag: Optional[str] = None,
    year: Optional[int] = None,
    file_type: Optional[str] = Query(None, description="Filter by file extension, e.g. csv"),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
):
    """Public, guest-accessible dataset browse & search.

    Only approved datasets whose visibility is not ``private`` are returned to
    guests and ordinary users. Super admins see everything.
    """
    stmt = select(Dataset).where(Dataset.is_deleted.is_(False))

    if not (user and user.is_super_admin):
        stmt = stmt.where(
            Dataset.status == DatasetStatus.APPROVED,
            Dataset.visibility != Visibility.PRIVATE,
        )

    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Dataset.title).like(like),
                func.lower(func.coalesce(Dataset.description, "")).like(like),
                func.lower(func.coalesce(Dataset.keywords, "")).like(like),
                func.lower(func.coalesce(Dataset.authors, "")).like(like),
            )
        )
    if research_area_id:
        stmt = stmt.where(Dataset.research_area_id == research_area_id)
    if category_id:
        stmt = stmt.where(Dataset.category_id == category_id)
    if department_id:
        stmt = stmt.where(Dataset.department_id == department_id)
    if license_id:
        stmt = stmt.where(Dataset.license_id == license_id)
    if year:
        stmt = stmt.where(func.extract("year", Dataset.created_at) == year)
    if tag:
        stmt = stmt.where(
            Dataset.id.in_(
                select(dataset_tags.c.dataset_id)
                .join(Tag, Tag.id == dataset_tags.c.tag_id)
                .where(Tag.slug == ds.slugify(tag))
            )
        )
    if file_type:
        ext = file_type.lower().lstrip(".")
        stmt = stmt.where(
            Dataset.id.in_(
                select(DatasetVersion.dataset_id)
                .join(FileModel, FileModel.version_id == DatasetVersion.id)
                .where(func.lower(FileModel.filename).like(f"%.{ext}"))
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    stmt = stmt.order_by(SORT_MAP.get(sort, Dataset.created_at.desc()))
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    stmt = stmt.options(selectinload(Dataset.tags))

    items = db.scalars(stmt).unique().all()
    return Page[DatasetListItem](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if page_size else 1,
    )


@router.get("/mine", response_model=List[DatasetListItem])
def my_datasets(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    stmt = (
        select(Dataset)
        .where(Dataset.owner_id == user.id, Dataset.is_deleted.is_(False))
        .order_by(Dataset.created_at.desc())
        .options(selectinload(Dataset.tags))
    )
    return db.scalars(stmt).unique().all()


# --------------------------------------------------------------------------- #
# Retrieve
# --------------------------------------------------------------------------- #
def _get_dataset_or_404(db: Session, slug_or_id: str) -> Dataset:
    stmt = select(Dataset).options(
        selectinload(Dataset.tags),
        selectinload(Dataset.versions).selectinload(DatasetVersion.files),
    )
    if slug_or_id.isdigit():
        stmt = stmt.where(Dataset.id == int(slug_or_id))
    else:
        stmt = stmt.where(Dataset.slug == slug_or_id)
    dataset = db.scalars(stmt).unique().one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{slug}", response_model=DatasetDetail)
def get_dataset(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    dataset = _get_dataset_or_404(db, slug)
    if not ds.can_view_dataset(dataset, user):
        raise HTTPException(status_code=403, detail="You cannot view this dataset")

    # Record a view (deduplicated loosely by not blocking owner/admin views).
    db.add(View(dataset_id=dataset.id, user_id=user.id if user else None,
                ip_address=client_ip(request)))
    dataset.view_count += 1
    db.commit()
    db.refresh(dataset)
    return dataset


# --------------------------------------------------------------------------- #
# Create / update / delete
# --------------------------------------------------------------------------- #
@router.post("", response_model=DatasetDetail, status_code=201)
def create_dataset(
    payload: DatasetCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_uploader),
):
    dataset = Dataset(
        slug=ds.unique_slug(db, payload.title),
        owner_id=user.id,
        status=DatasetStatus.PENDING_APPROVAL,
        **payload.model_dump(exclude={"tags"}),
    )
    dataset.tags = ds.resolve_tags(db, payload.tags)
    db.add(dataset)
    db.flush()

    # Every dataset starts at version 1.0.
    db.add(DatasetVersion(dataset_id=dataset.id, version="1.0", is_current=True,
                          created_by_id=user.id))
    write_audit(db, actor_id=user.id, action="dataset.create",
                entity_type="dataset", entity_id=dataset.id,
                ip_address=client_ip(request))
    db.commit()
    db.refresh(dataset)
    return dataset


@router.patch("/{dataset_id}", response_model=DatasetDetail)
def update_dataset(
    dataset_id: int,
    payload: DatasetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.owner_id != user.id and not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not your dataset")

    data = payload.model_dump(exclude_unset=True)
    tags = data.pop("tags", None)
    for field, value in data.items():
        setattr(dataset, field, value)
    if tags is not None:
        dataset.tags = ds.resolve_tags(db, tags)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.delete("/{dataset_id}", response_model=Message)
def delete_dataset(
    dataset_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.owner_id != user.id and not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not your dataset")
    dataset.is_deleted = True
    dataset.status = DatasetStatus.DELETED
    write_audit(db, actor_id=user.id, action="dataset.delete",
                entity_type="dataset", entity_id=dataset.id,
                ip_address=client_ip(request))
    db.commit()
    return Message(detail="Dataset deleted (recoverable by administrators)")


# --------------------------------------------------------------------------- #
# Versioning & file upload
# --------------------------------------------------------------------------- #
@router.post("/{dataset_id}/versions", response_model=DatasetVersionRead, status_code=201)
def create_version(
    dataset_id: int,
    changelog: Optional[str] = Form(None),
    major: bool = Form(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.owner_id != user.id and not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not your dataset")

    from app.utils import next_version

    for v in dataset.versions:
        v.is_current = False
    new_version = DatasetVersion(
        dataset_id=dataset.id,
        version=next_version(dataset.latest_version.version if dataset.latest_version else None, major),
        changelog=changelog,
        is_current=True,
        created_by_id=user.id,
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    return new_version


@router.post("/{dataset_id}/files", response_model=List[FileRead], status_code=201)
async def upload_files(
    dataset_id: int,
    request: Request,
    files: List[UploadFile] = UploadFileField(...),
    version_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_uploader),
):
    """Upload one or more files to a dataset version.

    Any file type is accepted (no extension restrictions). Each file's SHA-256
    checksum and size are computed by the storage backend. The virus scan status
    is set to ``skipped`` as a placeholder for a future ClamAV integration.
    """
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.owner_id != user.id and not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not your dataset")

    version = (
        db.get(DatasetVersion, version_id) if version_id else dataset.latest_version
    )
    if not version or version.dataset_id != dataset.id:
        raise HTTPException(status_code=400, detail="Invalid version for this dataset")

    storage = get_storage()
    created: list[FileModel] = []
    for upload in files:
        key = f"datasets/{dataset.id}/v{version.id}/{upload.filename}"
        size, checksum = storage.save(key, upload.file)
        record = FileModel(
            version_id=version.id,
            filename=upload.filename,
            storage_key=key,
            content_type=upload.content_type,
            size_bytes=size,
            checksum_sha256=checksum,
            virus_scan_status="skipped",
        )
        db.add(record)
        created.append(record)

    db.flush()
    version.total_size_bytes = sum(f.size_bytes for f in version.files)
    ds.recalc_counters(db, dataset)
    dataset.updated_at = datetime.now(timezone.utc)
    write_audit(db, actor_id=user.id, action="dataset.upload_files",
                entity_type="dataset", entity_id=dataset.id,
                detail=f"{len(created)} file(s)", ip_address=client_ip(request))
    db.commit()
    for record in created:
        db.refresh(record)
    return created


@router.get("/{dataset_id}/files/{file_id}/download")
def download_file(
    dataset_id: int,
    file_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    record = db.get(FileModel, file_id)
    if not record or record.version.dataset_id != dataset.id:
        raise HTTPException(status_code=404, detail="File not found")

    if not ds.has_download_access(db, dataset, user):
        raise HTTPException(
            status_code=403,
            detail="You need an approved access request to download this dataset",
        )

    storage = get_storage()
    if not storage.exists(record.storage_key):
        raise HTTPException(status_code=410, detail="File no longer available")

    # Record the download and notify the owner.
    db.add(Download(dataset_id=dataset.id, file_id=record.id, user_id=user.id,
                    ip_address=client_ip(request),
                    user_agent=request.headers.get("user-agent", "")[:512]))
    dataset.download_count += 1
    if dataset.owner_id != user.id:
        create_notification(
            db, user_id=dataset.owner_id, type=NotificationType.NEW_DOWNLOAD,
            title="New download",
            body=f"{user.username} downloaded {record.filename}",
            link=f"/datasets/{dataset.slug}",
        )
    write_audit(db, actor_id=user.id, action="dataset.download",
                entity_type="file", entity_id=record.id,
                ip_address=client_ip(request))
    db.commit()

    stream = storage.open(record.storage_key)

    def _iterfile():
        # Chunked streaming works uniformly for a local file object and for an
        # S3/MinIO StreamingBody, and guarantees the handle is closed.
        try:
            while True:
                chunk = stream.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk
        finally:
            close = getattr(stream, "close", None)
            if callable(close):
                close()

    return StreamingResponse(
        _iterfile(),
        media_type=record.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{record.filename}"',
            "Content-Length": str(record.size_bytes),
        },
    )


# --------------------------------------------------------------------------- #
# Favorites & comments
# --------------------------------------------------------------------------- #
@router.post("/{dataset_id}/favorite", response_model=Message)
def toggle_favorite(
    dataset_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    existing = db.scalar(
        select(Favorite).where(
            Favorite.dataset_id == dataset_id, Favorite.user_id == user.id
        )
    )
    if existing:
        db.delete(existing)
        dataset.like_count = max(0, dataset.like_count - 1)
        db.commit()
        return Message(detail="Removed from favorites")
    db.add(Favorite(dataset_id=dataset_id, user_id=user.id))
    dataset.like_count += 1
    db.commit()
    return Message(detail="Added to favorites")


@router.get("/{dataset_id}/comments", response_model=List[CommentRead])
def list_comments(dataset_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(Comment)
        .where(Comment.dataset_id == dataset_id)
        .order_by(Comment.created_at.asc())
    )
    return db.scalars(stmt).all()


@router.post("/{dataset_id}/comments", response_model=CommentRead, status_code=201)
def add_comment(
    dataset_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    comment = Comment(
        dataset_id=dataset_id, user_id=user.id, body=payload.body,
        parent_id=payload.parent_id,
    )
    db.add(comment)
    if dataset.owner_id != user.id:
        create_notification(
            db, user_id=dataset.owner_id, type=NotificationType.NEW_COMMENT,
            title="New comment",
            body=f"{user.username} commented on {dataset.title}",
            link=f"/datasets/{dataset.slug}",
        )
    db.commit()
    db.refresh(comment)
    return comment
