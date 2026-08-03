"""User, Role and Permission models plus association tables."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Table,
    Column,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import UserStatus

# Many-to-many between roles and permissions.
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "permission_id",
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255))

    users: Mapped[List["User"]] = relationship(back_populates="role")
    permissions: Mapped[List["Permission"]] = relationship(
        secondary=role_permissions, back_populates="roles"
    )


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255))

    roles: Mapped[List["Role"]] = relationship(
        secondary=role_permissions, back_populates="permissions"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(160))

    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True)
    role: Mapped["Role"] = relationship(back_populates="users", lazy="joined")

    status: Mapped[UserStatus] = mapped_column(default=UserStatus.PENDING_VERIFICATION)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Profile / affiliation
    affiliation: Mapped[Optional[str]] = mapped_column(String(255))
    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL")
    )
    department: Mapped[Optional["Department"]] = relationship()
    bio: Mapped[Optional[str]] = mapped_column(Text)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512))

    # Security helpers
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(128))
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(128))
    password_reset_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    datasets: Mapped[List["Dataset"]] = relationship(
        back_populates="owner", foreign_keys="Dataset.owner_id"
    )

    @property
    def role_name(self) -> str:
        return self.role.name if self.role else ""

    @property
    def is_super_admin(self) -> bool:
        return self.role_name == "super_admin"
