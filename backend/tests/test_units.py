"""Pure unit tests for utility and service functions."""
from __future__ import annotations

from app.utils import human_size, next_version, slugify


def test_slugify():
    assert slugify("Rice Disease Dataset!") == "rice-disease-dataset"
    assert slugify("  Multiple   Spaces ") == "multiple-spaces"
    assert slugify("") == "item"


def test_next_version():
    assert next_version(None) == "1.0"
    assert next_version("1.0") == "1.1"
    assert next_version("1.9") == "1.10"
    assert next_version("1.0", major_bump=True) == "2.0"


def test_human_size():
    assert human_size(0) == "0.0 B"
    assert human_size(1024) == "1.0 KB"
    assert human_size(1024 * 1024) == "1.0 MB"


def test_password_hashing():
    from app.core.security import hash_password, verify_password

    hashed = hash_password("Secret#123")
    assert hashed != "Secret#123"
    assert verify_password("Secret#123", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_roundtrip():
    from app.core.security import ACCESS_TOKEN, create_access_token, decode_token

    token = create_access_token(42)
    claims = decode_token(token)
    assert claims["sub"] == "42"
    assert claims["type"] == ACCESS_TOKEN
