"""Access request, download and view tracking models."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AccessLevel, AccessRequestStatus, GrantDuration


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"), index=True
    )
    dataset: Mapped["Dataset"] = relationship()
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    requester: Mapped["User"] = relationship(foreign_keys=[requester_id], lazy="joined")

    # Request payload (from the popup form)
    purpose: Mapped[Optional[str]] = mapped_column(Text)
    institution: Mapped[Optional[str]] = mapped_column(String(255))
    research_area: Mapped[Optional[str]] = mapped_column(String(255))
    message: Mapped[Optional[str]] = mapped_column(Text)

    status: Mapped[AccessRequestStatus] = mapped_column(
        default=AccessRequestStatus.PENDING, index=True
    )

    # Decision details
    decided_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    decision_note: Mapped[Optional[str]] = mapped_column(Text)
    access_level: Mapped[Optional[AccessLevel]] = mapped_column()
    grant_duration: Mapped[Optional[GrantDuration]] = mapped_column()
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def is_active_grant(self) -> bool:
        if self.status != AccessRequestStatus.APPROVED:
            return False
        if self.expires_at is None:
            return True
        return self.expires_at > datetime.now(self.expires_at.tzinfo)


class Download(Base):
    __tablename__ = "downloads"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"), index=True
    )
    file_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("files.id", ondelete="SET NULL")
    )
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64))
    user_agent: Mapped[Optional[str]] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class View(Base):
    __tablename__ = "views"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    ip_address: Mapped[Optional[str]] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
