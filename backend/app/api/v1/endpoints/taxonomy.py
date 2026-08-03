"""Read-only taxonomy endpoints (public) + admin management."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_super_admin
from app.models.taxonomy import Category, Department, License, ResearchArea, Tag
from app.models.user import User
from app.schemas.taxonomy import (
    CategoryRead,
    DepartmentRead,
    LicenseRead,
    ResearchAreaRead,
    SimpleCreate,
    TagRead,
)
from app.utils import slugify

router = APIRouter(prefix="/taxonomy", tags=["Taxonomy"])


@router.get("/departments", response_model=List[DepartmentRead])
def departments(db: Session = Depends(get_db)):
    return db.scalars(select(Department).order_by(Department.name)).all()


@router.get("/research-areas", response_model=List[ResearchAreaRead])
def research_areas(db: Session = Depends(get_db)):
    return db.scalars(select(ResearchArea).order_by(ResearchArea.name)).all()


@router.get("/categories", response_model=List[CategoryRead])
def categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.get("/licenses", response_model=List[LicenseRead])
def licenses(db: Session = Depends(get_db)):
    return db.scalars(select(License).order_by(License.name)).all()


@router.get("/tags", response_model=List[TagRead])
def tags(db: Session = Depends(get_db)):
    return db.scalars(select(Tag).order_by(Tag.name).limit(200)).all()


@router.post("/categories", response_model=CategoryRead, status_code=201)
def create_category(
    payload: SimpleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    category = Category(
        name=payload.name, slug=slugify(payload.name), description=payload.description
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.post("/research-areas", response_model=ResearchAreaRead, status_code=201)
def create_research_area(
    payload: SimpleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    area = ResearchArea(
        name=payload.name, slug=slugify(payload.name), description=payload.description
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return area
