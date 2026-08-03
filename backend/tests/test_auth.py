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
