"""Email delivery service.

If SMTP is not configured the message is logged to stdout, so every
notification flow works end-to-end in development without an SMTP server.
Templates are simple string builders kept close to the send site for clarity.
"""
from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("tairi.email")


def send_email(to: str, subject: str, html_body: str) -> None:
    """Send an HTML email, or log it when SMTP is not configured."""
    if not settings.SMTP_HOST:
        logger.info("[EMAIL:mock] to=%s subject=%s\n%s", to, subject, html_body)
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
            server.sendmail(settings.SMTP_FROM, [to], message.as_string())
    except Exception:  # pragma: no cover - network dependent
        logger.exception("Failed to send email to %s", to)


def _wrap(title: str, body_html: str) -> str:
    return f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;
                color:#0f172a;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <div style="background:#0056A6;padding:20px 24px;color:#fff;font-size:18px;font-weight:600">
        TAIRI DataHub
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px;font-size:18px">{title}</h2>
        {body_html}
      </div>
      <div style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px">
        TAIRI Lab &middot; University of Rwanda &middot; This is an automated message.
      </div>
    </div>
    """


def send_account_created(to: str, username: str, temp_password: str | None = None) -> None:
    extra = (
        f"<p>Temporary password: <b>{temp_password}</b> (please change it on first login).</p>"
        if temp_password
        else ""
    )
    body = _wrap(
        "Your account is ready",
        f"<p>Hello <b>{username}</b>,</p>"
        f"<p>Your TAIRI DataHub account has been created.</p>{extra}"
        f'<p><a href="{settings.FRONTEND_URL}/login">Sign in</a></p>',
    )
    send_email(to, "Welcome to TAIRI DataHub", body)


def send_verification(to: str, username: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    body = _wrap(
        "Verify your email",
        f"<p>Hello <b>{username}</b>,</p>"
        f'<p>Please confirm your email address to activate your account.</p>'
        f'<p><a href="{link}">Verify email</a></p>',
    )
    send_email(to, "Verify your TAIRI DataHub email", body)


def send_password_reset(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    body = _wrap(
        "Reset your password",
        f'<p>We received a request to reset your password.</p>'
        f'<p><a href="{link}">Choose a new password</a></p>'
        f"<p>If you did not request this, you can ignore this email.</p>",
    )
    send_email(to, "Reset your TAIRI DataHub password", body)


def send_access_request_received(to: str, dataset_title: str, requester: str) -> None:
    body = _wrap(
        "New access request",
        f"<p><b>{requester}</b> requested access to your dataset "
        f"<b>{dataset_title}</b>.</p>"
        f'<p><a href="{settings.FRONTEND_URL}/dashboard/requests">Review request</a></p>',
    )
    send_email(to, f"Access request: {dataset_title}", body)


def send_access_decision(to: str, dataset_title: str, approved: bool, note: str | None) -> None:
    verdict = "approved" if approved else "rejected"
    note_html = f"<p>Reviewer note: {note}</p>" if note else ""
    body = _wrap(
        f"Access request {verdict}",
        f"<p>Your request to access <b>{dataset_title}</b> was <b>{verdict}</b>.</p>"
        f"{note_html}"
        f'<p><a href="{settings.FRONTEND_URL}/dashboard/requests">View details</a></p>',
    )
    send_email(to, f"Access {verdict}: {dataset_title}", body)


def send_dataset_updated(to: str, dataset_title: str) -> None:
    body = _wrap(
        "Dataset updated",
        f"<p>A dataset you follow, <b>{dataset_title}</b>, has a new version.</p>"
        f'<p><a href="{settings.FRONTEND_URL}">Browse datasets</a></p>',
    )
    send_email(to, f"Updated: {dataset_title}", body)
