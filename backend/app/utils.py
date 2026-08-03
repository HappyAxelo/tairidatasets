"""Small shared utilities."""
from __future__ import annotations

import re
import unicodedata


def slugify(value: str, max_length: int = 200) -> str:
    """Return an URL-safe slug for ``value``."""
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^\w\s-]", "", value).strip().lower()
    value = re.sub(r"[-\s]+", "-", value)
    return value[:max_length] or "item"


def next_version(current: str | None, major_bump: bool = False) -> str:
    """Compute the next semantic-ish dataset version string.

    ``1.0`` -> ``1.1`` on a minor upload, or ``2.0`` when ``major_bump``.
    """
    if not current:
        return "1.0"
    try:
        major, minor = (int(p) for p in current.split(".")[:2])
    except ValueError:
        return "1.0"
    if major_bump:
        return f"{major + 1}.0"
    return f"{major}.{minor + 1}"


def human_size(num_bytes: int) -> str:
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024 or unit == "TB":
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"
