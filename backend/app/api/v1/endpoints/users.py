"""Current-user profile, favorites and activity endpoints."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.access import View
from app.models.dataset import Dataset
from app.models.social import Favorite
from app.models.user import User
from app.schemas.dataset import DatasetListItem
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/favorites", response_model=List[DatasetListItem])
def my_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = (
        select(Dataset)
        .join(Favorite, Favorite.dataset_id == Dataset.id)
        .where(Favorite.user_id == user.id, Dataset.is_deleted.is_(False))
        .order_by(desc(Favorite.created_at))
        .options(selectinload(Dataset.tags))
    )
    return db.scalars(stmt).unique().all()


@router.get("/me/recently-viewed", response_model=List[DatasetListItem])
def recently_viewed(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recent_ids = db.scalars(
        select(View.dataset_id)
        .where(View.user_id == user.id)
        .order_by(desc(View.created_at))
        .limit(50)
    ).all()
    # Preserve order, de-duplicate.
    seen: list[int] = []
    for did in recent_ids:
        if did not in seen:
            seen.append(did)
        if len(seen) >= 8:
            break
    if not seen:
        return []
    datasets = db.scalars(
        select(Dataset)
        .where(Dataset.id.in_(seen), Dataset.is_deleted.is_(False))
        .options(selectinload(Dataset.tags))
    ).unique().all()
    order = {did: i for i, did in enumerate(seen)}
    return sorted(datasets, key=lambda d: order.get(d.id, 999))
