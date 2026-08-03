"""Access request, notification and comment schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    AccessLevel,
    AccessRequestStatus,
    GrantDuration,
    NotificationType,
)
from app.schemas.user import UserPublic


class AccessRequestCreate(BaseModel):
    purpose: str
    institution: Optional[str] = None
    research_area: Optional[str] = None
    message: Optional[str] = None


class AccessRequestDecision(BaseModel):
    approve: bool
    decision_note: Optional[str] = None
    access_level: AccessLevel = AccessLevel.DOWNLOAD
    grant_duration: GrantDuration = GrantDuration.PERMANENT
    expires_at: Optional[datetime] = None


class AccessRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dataset_id: int
    requester: UserPublic
    purpose: Optional[str] = None
    institution: Optional[str] = None
    research_area: Optional[str] = None
    message: Optional[str] = None
    status: AccessRequestStatus
    access_level: Optional[AccessLevel] = None
    grant_duration: Optional[GrantDuration] = None
    decision_note: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    decided_at: Optional[datetime] = None


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: NotificationType
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    is_read: bool
    created_at: datetime


class CommentCreate(BaseModel):
    body: str
    parent_id: Optional[int] = None


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    body: str
    parent_id: Optional[int] = None
    user: UserPublic
    created_at: datetime
