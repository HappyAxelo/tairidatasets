"""Authentication endpoints: register, login, refresh, verify, password flows."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import client_ip, get_current_user
from app.core.security import (
    REFRESH_TOKEN,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_url_safe_token,
    hash_password,
    verify_password,
)
from app.models.enums import RoleName, UserStatus
from app.models.user import Role, User
from app.schemas.auth import (
    EmailVerification,
    LoginRequest,
    PasswordChange,
    PasswordResetConfirm,
    PasswordResetRequest,
    Token,
    TokenRefresh,
)
from app.schemas.common import Message
from app.schemas.user import UserCreate, UserRead
from app.services import email as email_service
from app.services.notifications import write_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _issue_tokens(user: User) -> Token:
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Public self-registration. New accounts get the Researcher role."""
    exists = db.scalar(
        select(User).where((User.email == payload.email) | (User.username == payload.username))
    )
    if exists:
        raise HTTPException(status_code=409, detail="Email or username already registered")

    role = db.scalar(select(Role).where(Role.name == RoleName.RESEARCHER.value))
    token = generate_url_safe_token()
    user = User(
        email=payload.email,
        username=payload.username,
        full_name=payload.full_name,
        affiliation=payload.affiliation,
        department_id=payload.department_id,
        hashed_password=hash_password(payload.password),
        role_id=role.id,
        status=UserStatus.PENDING_VERIFICATION,
        email_verification_token=token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    email_service.send_verification(user.email, user.username, token)
    return user


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 password login. ``username`` field accepts the user's email."""
    user = db.scalar(select(User).where(User.email == form.username))
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=403, detail="Account suspended")

    user.last_login_at = datetime.now(timezone.utc)
    write_audit(db, actor_id=user.id, action="user.login", ip_address=client_ip(request))
    db.commit()
    return _issue_tokens(user)


@router.post("/login/json", response_model=Token)
def login_json(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """JSON login convenience endpoint for the SPA frontend."""
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=403, detail="Account suspended")
    user.last_login_at = datetime.now(timezone.utc)
    write_audit(db, actor_id=user.id, action="user.login", ip_address=client_ip(request))
    db.commit()
    return _issue_tokens(user)


@router.post("/refresh", response_model=Token)
def refresh(payload: TokenRefresh, db: Session = Depends(get_db)):
    try:
        claims = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if claims.get("type") != REFRESH_TOKEN:
        raise HTTPException(status_code=401, detail="Not a refresh token")
    user = db.get(User, int(claims["sub"]))
    if not user or user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=401, detail="User unavailable")
    return _issue_tokens(user)


@router.post("/verify-email", response_model=Message)
def verify_email(payload: EmailVerification, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(User.email_verification_token == payload.token)
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    user.is_email_verified = True
    user.email_verification_token = None
    if user.status == UserStatus.PENDING_VERIFICATION:
        user.status = UserStatus.ACTIVE
    db.commit()
    return Message(detail="Email verified successfully")


@router.post("/forgot-password", response_model=Message)
def forgot_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    # Always return success to avoid user enumeration.
    if user:
        token = generate_url_safe_token()
        user.password_reset_token = token
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=2)
        db.commit()
        email_service.send_password_reset(user.email, token)
    return Message(detail="If the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=Message)
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.password_reset_token == payload.token))
    if (
        not user
        or not user.password_reset_expires
        or user.password_reset_expires < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return Message(detail="Password reset successfully")


@router.post("/change-password", response_model=Message)
def change_password(
    payload: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return Message(detail="Password changed successfully")


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user
