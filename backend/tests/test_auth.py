"""Authentication flow integration tests."""
from __future__ import annotations


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_and_login(client, seeded):
    reg = client.post("/api/v1/auth/register", json={
        "email": "newuser@ur.ac.rw",
        "username": "newuser",
        "password": "Password#123",
        "full_name": "New User",
    })
    assert reg.status_code == 201, reg.text
    assert reg.json()["role"]["name"] == "researcher"

    login = client.post("/api/v1/auth/login/json", json={
        "email": "newuser@ur.ac.rw", "password": "Password#123",
    })
    assert login.status_code == 200
    body = login.json()
    assert "access_token" in body and "refresh_token" in body

    me = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {body['access_token']}"
    })
    assert me.status_code == 200
    assert me.json()["email"] == "newuser@ur.ac.rw"


def test_login_rejects_bad_password(client, seeded):
    resp = client.post("/api/v1/auth/login/json", json={
        "email": "aline.uwase@student.ur.ac.rw", "password": "wrong",
    })
    assert resp.status_code == 401


def test_refresh_token(client, seeded):
    login = client.post("/api/v1/auth/login/json", json={
        "email": "researcher@ur.ac.rw", "password": "Researcher#2026",
    })
    assert login.status_code == 200
    refresh = client.post("/api/v1/auth/refresh", json={
        "refresh_token": login.json()["refresh_token"],
    })
    assert refresh.status_code == 200
    assert "access_token" in refresh.json()


def test_password_reset_flow(client, seeded, db_session):
    from app.models.user import User

    email = "researcher@ur.ac.rw"
    resp = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200
    user = db_session.query(User).filter_by(email=email).one()
    token = user.password_reset_token
    assert token

    resp = client.post("/api/v1/auth/reset-password", json={
        "token": token, "new_password": "BrandNew#2026",
    })
    assert resp.status_code == 200, resp.text
    login = client.post("/api/v1/auth/login/json", json={
        "email": email, "password": "BrandNew#2026",
    })
    assert login.status_code == 200
    # Token is single-use.
    again = client.post("/api/v1/auth/reset-password", json={
        "token": token, "new_password": "Another#2026",
    })
    assert again.status_code == 400

    # Restore the seeded password so later tests can still sign in.
    from app.core.security import hash_password
    user.hashed_password = hash_password("Researcher#2026")
    db_session.commit()


def test_browsing_does_not_consume_login_budget(monkeypatch):
    import asyncio

    from starlette.requests import Request
    from starlette.responses import Response

    from app.core.config import settings
    from app.core.middleware import RateLimitMiddleware

    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", True)
    mw = RateLimitMiddleware(app=None, limit=1000, window=60)

    async def ok(_request):
        return Response("ok")

    def call(path: str) -> int:
        scope = {"type": "http", "method": "GET", "path": path, "headers": [],
                 "client": ("1.2.3.4", 1234), "query_string": b""}
        return asyncio.run(mw.dispatch(Request(scope), ok)).status_code

    for _ in range(100):
        assert call("/api/v1/datasets") == 200
    assert call("/api/v1/auth/login/json") == 200
    statuses = [call("/api/v1/auth/login/json") for _ in range(settings.RATE_LIMIT_AUTH_REQUESTS)]
    assert statuses[-1] == 429
