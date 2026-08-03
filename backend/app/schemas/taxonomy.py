"""Taxonomy schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class NamedRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class DepartmentRead(NamedRead):
    faculty: Optional[str] = None


class ResearchAreaRead(NamedRead):
    slug: str
    description: Optional[str] = None


class CategoryRead(NamedRead):
    slug: str
    description: Optional[str] = None


class TagRead(NamedRead):
    slug: str


class LicenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    url: Optional[str] = None


class SimpleCreate(BaseModel):
    name: str
    description: Optional[str] = None
