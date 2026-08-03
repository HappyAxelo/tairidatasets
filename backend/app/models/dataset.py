"""Dataset, DatasetVersion and File models."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import DatasetStatus, Visibility
from app.models.taxonomy import dataset_tags


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Bibliographic / academic metadata
    authors: Mapped[Optional[str]] = mapped_column(String(512))
    affiliation: Mapped[Optional[str]] = mapped_column(String(255))
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    keywords: Mapped[Optional[str]] = mapped_column(String(512))
    funding_agency: Mapped[Optional[str]] = mapped_column(String(255))
    doi: Mapped[Optional[str]] = mapped_column(String(120))
    publication_link: Mapped[Optional[str]] = mapped_column(String(512))
    citation_text: Mapped[Optional[str]] = mapped_column(Text)
    readme: Mapped[Optional[str]] = mapped_column(Text)
    documentation: Mapped[Optional[str]] = mapped_column(Text)
    preview_image_url: Mapped[Optional[str]] = mapped_column(String(512))

    # Classification
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    owner: Mapped["User"] = relationship(
        back_populates="datasets", foreign_keys=[owner_id], lazy="joined"
    )
    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL")
    )
    department: Mapped[Optional["Department"]] = relationship()
    research_area_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("research_areas.id", ondelete="SET NULL")
    )
    research_area: Mapped[Optional["ResearchArea"]] = relationship()
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL")
    )
    category: Mapped[Optional["Category"]] = relationship()
    license_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("licenses.id", ondelete="SET NULL")
    )
    license: Mapped[Optional["License"]] = relationship(lazy="joined")

    tags: Mapped[List["Tag"]] = relationship(
        secondary=dataset_tags, back_populates="datasets"
    )

    # State
    visibility: Mapped[Visibility] = mapped_column(default=Visibility.PUBLIC_METADATA)
    status: Mapped[DatasetStatus] = mapped_column(
        default=DatasetStatus.PENDING_APPROVAL, index=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)

    # Denormalised counters (kept in sync by services for fast listing)
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    total_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    file_count: Mapped[int] = mapped_column(Integer, default=0)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    versions: Mapped[List["DatasetVersion"]] = relationship(
        back_populates="dataset",
        cascade="all, delete-orphan",
        order_by="DatasetVersion.created_at.desc()",
    )

    @property
    def latest_version(self) -> Optional["DatasetVersion"]:
        return self.versions[0] if self.versions else None


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"), index=True
    )
    dataset: Mapped["Dataset"] = relationship(back_populates="versions")

    version: Mapped[str] = mapped_column(String(20))  # e.g. "1.0", "1.1", "2.0"
    changelog: Mapped[Optional[str]] = mapped_column(Text)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    total_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)

    created_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    files: Mapped[List["File"]] = relationship(
        back_populates="version", cascade="all, delete-orphan"
    )


class File(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True)
    version_id: Mapped[int] = mapped_column(
        ForeignKey("dataset_versions.id", ondelete="CASCADE"), index=True
    )
    version: Mapped["DatasetVersion"] = relationship(back_populates="files")

    filename: Mapped[str] = mapped_column(String(512))
    # Relative path/key within the storage backend (local or object store).
    storage_key: Mapped[str] = mapped_column(String(1024))
    content_type: Mapped[Optional[str]] = mapped_column(String(160))
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    checksum_sha256: Mapped[Optional[str]] = mapped_column(String(64))
    # Placeholder for antivirus integration (ClamAV etc.)
    virus_scan_status: Mapped[str] = mapped_column(String(20), default="pending")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
