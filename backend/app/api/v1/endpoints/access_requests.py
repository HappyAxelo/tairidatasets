"""Access request workflow endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import client_ip, get_current_user
from app.models.access import AccessRequest
from app.models.dataset import Dataset
from app.models.enums import AccessRequestStatus, NotificationType
from app.models.user import User
from app.schemas.access import (
    AccessRequestCreate,
    AccessRequestDecision,
    AccessRequestRead,
)
from app.schemas.common import Message
from app.services import email as email_service
from app.services.notifications import create_notification, write_audit

router = APIRouter(prefix="/access-requests", tags=["Access Requests"])


@router.post("/datasets/{dataset_id}", response_model=AccessRequestRead, status_code=201)
def request_access(
    dataset_id: int,
    payload: AccessRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.owner_id == user.id:
        raise HTTPException(status_code=400, detail="You already own this dataset")

    existing = db.scalar(
        select(AccessRequest).where(
            AccessRequest.dataset_id == dataset_id,
            AccessRequest.requester_id == user.id,
            AccessRequest.status.in_(
                [AccessRequestStatus.PENDING, AccessRequestStatus.APPROVED]
            ),
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active request")

    access_request = AccessRequest(
        dataset_id=dataset_id,
        requester_id=user.id,
        purpose=payload.purpose,
        institution=payload.institution,
        research_area=payload.research_area,
        message=payload.message,
    )
    db.add(access_request)
    create_notification(
        db, user_id=dataset.owner_id, type=NotificationType.ACCESS_REQUESTED,
        title="New access request",
        body=f"{user.username} requested access to {dataset.title}",
        link="/dashboard/requests",
    )
    write_audit(db, actor_id=user.id, action="access.request",
                entity_type="dataset", entity_id=dataset_id,
                ip_address=client_ip(request))
    db.commit()
    db.refresh(access_request)

    if dataset.owner and dataset.owner.email:
        email_service.send_access_request_received(
            dataset.owner.email, dataset.title, user.username
        )
    return access_request


@router.get("/incoming", response_model=List[AccessRequestRead])
def incoming_requests(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Requests targeting datasets owned by the current user."""
    stmt = (
        select(AccessRequest)
        .join(Dataset, Dataset.id == AccessRequest.dataset_id)
        .where(Dataset.owner_id == user.id)
        .order_by(AccessRequest.created_at.desc())
    )
    return db.scalars(stmt).unique().all()


@router.get("/outgoing", response_model=List[AccessRequestRead])
def outgoing_requests(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Requests the current user has made."""
    stmt = (
        select(AccessRequest)
        .where(AccessRequest.requester_id == user.id)
        .order_by(AccessRequest.created_at.desc())
    )
    return db.scalars(stmt).unique().all()


@router.post("/{request_id}/decide", response_model=AccessRequestRead)
def decide_request(
    request_id: int,
    payload: AccessRequestDecision,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    access_request = db.get(AccessRequest, request_id)
    if not access_request:
        raise HTTPException(status_code=404, detail="Request not found")
    dataset = db.get(Dataset, access_request.dataset_id)
    if dataset.owner_id != user.id and not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not authorised to decide this request")

    access_request.status = (
        AccessRequestStatus.APPROVED if payload.approve else AccessRequestStatus.REJECTED
    )
    access_request.decision_note = payload.decision_note
    access_request.decided_by_id = user.id
    access_request.decided_at = datetime.now(timezone.utc)
    if payload.approve:
        access_request.access_level = payload.access_level
        access_request.grant_duration = payload.grant_duration
        access_request.expires_at = payload.expires_at

    notif_type = (
        NotificationType.ACCESS_APPROVED if payload.approve else NotificationType.ACCESS_REJECTED
    )
    create_notification(
        db, user_id=access_request.requester_id, type=notif_type,
        title=f"Access {'approved' if payload.approve else 'rejected'}",
        body=f"Your request for {dataset.title} was "
        f"{'approved' if payload.approve else 'rejected'}",
        link=f"/datasets/{dataset.slug}",
    )
    write_audit(db, actor_id=user.id,
                action="access.approve" if payload.approve else "access.reject",
                entity_type="access_request", entity_id=request_id,
                ip_address=client_ip(request))
    db.commit()
    db.refresh(access_request)

    requester = db.get(User, access_request.requester_id)
    if requester and requester.email:
        email_service.send_access_decision(
            requester.email, dataset.title, payload.approve, payload.decision_note
        )
    return access_request


@router.post("/{request_id}/more-info", response_model=AccessRequestRead)
def request_more_info(
    request_id: int,
    payload: AccessRequestDecision,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    access_request = db.get(AccessRequest, request_id)
    if not access_request:
        raise HTTPException(status_code=404, detail="Request not found")
    dataset = db.get(Dataset, access_request.dataset_id)
    if dataset.owner_id != user.id and not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not authorised")

    access_request.status = AccessRequestStatus.MORE_INFO_REQUESTED
    access_request.decision_note = payload.decision_note
    create_notification(
        db, user_id=access_request.requester_id,
        type=NotificationType.MORE_INFO_REQUESTED,
        title="More information requested",
        body=f"The owner of {dataset.title} needs more information",
        link="/dashboard/requests",
    )
    db.commit()
    db.refresh(access_request)
    return access_request
