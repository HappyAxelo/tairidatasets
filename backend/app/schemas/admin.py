"""Admin/analytics schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class StatCards(BaseModel):
    datasets: int
    users: int
    downloads: int
    storage_bytes: int
    pending_requests: int
    pending_datasets: int


class TimeseriesPoint(BaseModel):
    label: str
    value: int


class NamedCount(BaseModel):
    name: str
    value: int


class AdminOverview(BaseModel):
    cards: StatCards
    monthly_uploads: List[TimeseriesPoint]
    top_datasets: List[NamedCount]
    research_areas: List[NamedCount]
    storage_by_area: List[NamedCount]


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    actor_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    detail: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class DownloadLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dataset_id: int
    file_id: Optional[int] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    created_at: datetime


class RoleChange(BaseModel):
    role: str


class AnnouncementCreate(BaseModel):
    title: str
    body: str
