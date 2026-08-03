"""Notification endpoints + WebSocket channel for real-time delivery."""
from __future__ import annotations

from typing import List

import jwt
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.models.system import Notification
from app.models.user import User
from app.schemas.access import NotificationRead
from app.schemas.common import Message
from app.services.notifications import ws_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationRead])
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    stmt = stmt.order_by(Notification.created_at.desc()).limit(100)
    return db.scalars(stmt).all()


@router.get("/unread-count", response_model=dict)
def unread_count(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from sqlalchemy import func

    count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user.id, Notification.is_read.is_(False)
        )
    )
    return {"count": int(count or 0)}


@router.post("/{notification_id}/read", response_model=Message)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return Message(detail="Marked as read")


@router.post("/read-all", response_model=Message)
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return Message(detail="All notifications marked as read")


@router.websocket("/ws")
async def notifications_ws(websocket: WebSocket, token: str = ""):
    """Authenticated WebSocket channel pushing notifications in real time.

    The client connects with ``?token=<access_token>``. Invalid tokens are
    rejected before the socket is accepted.
    """
    try:
        claims = decode_token(token)
        user_id = int(claims["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        await websocket.close(code=1008)
        return

    # Validate the user still exists / is active.
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if not user:
            await websocket.close(code=1008)
            return
    finally:
        db.close()

    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep the connection alive; client pings are ignored.
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
