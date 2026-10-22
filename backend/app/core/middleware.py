"""Custom middleware: security headers and a lightweight rate limiter."""
from __future__ import annotations

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers.setdefault(
            "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
        )
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Fixed-window rate limiter keyed by client IP.

    Login/auth endpoints are exempt, so sign-in is never blocked.
    All other traffic is still limited.
    """

    # Paths that are never rate limited.
    EXEMPT_PREFIXES = ("/docs", "/redoc", "/openapi")
    EXEMPT_SUFFIXES = (
        "/login",
        "/login/json",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/me",  # /auth/me also returned 429 on the live site
    )

    def __init__(self, app) -> None:
        super().__init__(app)
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _client(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        from app.core.config import settings

        path = request.url.path

        if (
            not settings.RATE_LIMIT_ENABLED
            or path.startswith(self.EXEMPT_PREFIXES)
            or path.endswith(self.EXEMPT_SUFFIXES)
        ):
            return await call_next(request)

        client = self._client(request)
        limit = settings.RATE_LIMIT_REQUESTS
        window = settings.RATE_LIMIT_WINDOW_SECONDS
        now = time.time()
        hits = [t for t in self._hits[client] if t > now - window]

        if len(hits) >= limit:
            retry_after = max(1, int(window - (now - hits[0])) + 1)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests, please slow down."},
                headers={"Retry-After": str(retry_after)},
            )

        hits.append(now)
        self._hits[client] = hits
        return await call_next(request)