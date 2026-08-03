"""Notification + audit-log helper services.

Notifications are persisted and (best-effort) pushed to connected WebSocket
clients via the in-process :data:`ws_manager`. Real-time delivery degrades
gracefully to polling if no socket is connected.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.system import AuditLog, Notification

logger = logging.getLogger("tairi.notifications")


class WebSocketManager:
    """Tracks live connections keyed by user id for real-time notifications."""

    def __init__(self) -> None:
        self._connections: dict[int, list] = {}

    async def connect(self, user_id: int, websocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket) -> None:
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(user_id, None)

    async def push(self, user_id: int, payload: dict) -> None:
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:  # pragma: no cover
                self.disconnect(user_id, ws)


ws_manager = WebSocketManager()


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: NotificationType,
    title: str,
    body: Optional[str] = None,
    link: Optional[str] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id, type=type, title=title, body=body, link=link
    )
    db.add(notification)
    db.flush()

    payload = {
        "id": notification.id,
        "type": type.value,
        "title": title,
        "body": body,
        "link": link,
    }
    # Best-effort real-time push without blocking the request.
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(ws_manager.push(user_id, payload))
    except RuntimeError:  # pragma: no cover - no running loop (sync context)
        pass
    return notification


def write_audit(
    db: Session,
    *,
    actor_id: Optional[int],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail,
            ip_address=ip_address,
        )
    )
