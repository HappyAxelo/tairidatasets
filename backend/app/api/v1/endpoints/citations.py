"""Citation generation endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.dataset import Dataset
from app.services import citation

router = APIRouter(prefix="/citations", tags=["Citations"])


def _dataset(db: Session, slug_or_id: str) -> Dataset:
    stmt = select(Dataset)
    if slug_or_id.isdigit():
        stmt = stmt.where(Dataset.id == int(slug_or_id))
    else:
        stmt = stmt.where(Dataset.slug == slug_or_id)
    dataset = db.scalar(stmt)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{slug}")
def get_citations(slug: str, db: Session = Depends(get_db)):
    """Return APA, IEEE and BibTeX citation strings for a dataset."""
    dataset = _dataset(db, slug)
    return citation.all_styles(dataset, settings.FRONTEND_URL)


@router.get("/{slug}/bibtex")
def get_bibtex(slug: str, db: Session = Depends(get_db)):
    from fastapi.responses import PlainTextResponse

    dataset = _dataset(db, slug)
    return PlainTextResponse(
        citation.bibtex(dataset, settings.FRONTEND_URL),
        media_type="application/x-bibtex",
        headers={"Content-Disposition": f'attachment; filename="{dataset.slug}.bib"'},
    )
