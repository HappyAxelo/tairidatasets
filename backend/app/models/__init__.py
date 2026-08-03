"""Import every model so SQLAlchemy's mapper registry is fully populated.

Importing this package (``import app.models``) guarantees all tables are
registered on ``Base.metadata`` before ``create_all`` or Alembic autogenerate.
"""
from app.models.access import AccessRequest, Download, View  # noqa: F401
from app.models.dataset import Dataset, DatasetVersion, File  # noqa: F401
from app.models.social import Citation, Comment, Favorite  # noqa: F401
from app.models.system import Announcement, AuditLog, Notification  # noqa: F401
from app.models.taxonomy import (  # noqa: F401
    Category,
    Department,
    License,
    ResearchArea,
    Tag,
)
from app.models.user import Permission, Role, User  # noqa: F401

__all__ = [
    "AccessRequest",
    "Announcement",
    "AuditLog",
    "Category",
    "Citation",
    "Comment",
    "Dataset",
    "DatasetVersion",
    "Department",
    "Download",
    "Favorite",
    "File",
    "License",
    "Notification",
    "Permission",
    "ResearchArea",
    "Role",
    "Tag",
    "User",
    "View",
]
