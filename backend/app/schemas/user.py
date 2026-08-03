"""User and role schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import RoleName, UserStatus


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=80)
    full_name: Optional[str] = None
    affiliation: Optional[str] = None
    department_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserAdminCreate(UserBase):
    """Super-admin provisioning of a user with an explicit role."""

    password: str = Field(min_length=8, max_length=128)
    role: RoleName = RoleName.RESEARCHER


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    affiliation: Optional[str] = None
    department_id: Optional[int] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    affiliation: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    status: UserStatus
    is_email_verified: bool
    role: RoleRead
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UserPublic(BaseModel):
    """Minimal public author card."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: Optional[str] = None
    affiliation: Optional[str] = None
    avatar_url: Optional[str] = None
