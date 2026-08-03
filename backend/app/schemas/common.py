"""Shared schema utilities."""
from __future__ import annotations

from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Generic paginated response envelope."""

    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int


class Message(BaseModel):
    detail: str
