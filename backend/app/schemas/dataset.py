"""Dataset, version and file schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DatasetStatus, Visibility
from app.schemas.taxonomy import (
    CategoryRead,
    DepartmentRead,
    LicenseRead,
    ResearchAreaRead,
    TagRead,
)
from app.schemas.user import UserPublic


class FileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    content_type: Optional[str] = None
    size_bytes: int
    checksum_sha256: Optional[str] = None
    virus_scan_status: str
    created_at: datetime


class DatasetVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    version: str
    changelog: Optional[str] = None
    is_current: bool
    total_size_bytes: int
    created_at: datetime
    files: List[FileRead] = []


class DatasetBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None
    authors: Optional[str] = None
    affiliation: Optional[str] = None
    contact_email: Optional[str] = None
    keywords: Optional[str] = None
    funding_agency: Optional[str] = None
    doi: Optional[str] = None
    publication_link: Optional[str] = None
    citation_text: Optional[str] = None
    readme: Optional[str] = None
    documentation: Optional[str] = None
    visibility: Visibility = Visibility.PUBLIC_METADATA
    department_id: Optional[int] = None
    research_area_id: Optional[int] = None
    category_id: Optional[int] = None
    license_id: Optional[int] = None
    tags: List[str] = []


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    authors: Optional[str] = None
    affiliation: Optional[str] = None
    contact_email: Optional[str] = None
    keywords: Optional[str] = None
    funding_agency: Optional[str] = None
    doi: Optional[str] = None
    publication_link: Optional[str] = None
    citation_text: Optional[str] = None
    readme: Optional[str] = None
    documentation: Optional[str] = None
    visibility: Optional[Visibility] = None
    department_id: Optional[int] = None
    research_area_id: Optional[int] = None
    category_id: Optional[int] = None
    license_id: Optional[int] = None
    tags: Optional[List[str]] = None


class DatasetListItem(BaseModel):
    """Compact representation used in browse/search listings."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    title: str
    authors: Optional[str] = None
    affiliation: Optional[str] = None
    visibility: Visibility
    status: DatasetStatus
    download_count: int
    view_count: int
    like_count: int
    file_count: int
    total_size_bytes: int
    preview_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner: UserPublic
    research_area: Optional[ResearchAreaRead] = None
    license: Optional[LicenseRead] = None
    tags: List[TagRead] = []


class DatasetDetail(DatasetListItem):
    description: Optional[str] = None
    contact_email: Optional[str] = None
    keywords: Optional[str] = None
    funding_agency: Optional[str] = None
    doi: Optional[str] = None
    publication_link: Optional[str] = None
    citation_text: Optional[str] = None
    readme: Optional[str] = None
    documentation: Optional[str] = None
    rejection_reason: Optional[str] = None
    department: Optional[DepartmentRead] = None
    category: Optional[CategoryRead] = None
    approved_at: Optional[datetime] = None
    versions: List[DatasetVersionRead] = []
