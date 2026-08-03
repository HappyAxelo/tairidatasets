"""Custom middleware: security headers and a lightweight rate limiter.

The rate limiter is an in-process token bucket suitable for a single Nginx
worker / single API instance. For a multi-instance deployment behind a load
balancer, swap the backing store for Redis (the interface stays identical).
"""
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

    Defaults to 120 requests / 60s. Auth endpoints get a stricter budget to
    slow credential-stuffing.
    """

    def __init__(self, app, limit: int = 120, window: int = 60) -> None:
        super().__init__(app)
        self.limit = limit
        self.window = window
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _client(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        from app.core.config import settings

        # Skip when disabled (tests) and for docs endpoints.
        if not settings.RATE_LIMIT_ENABLED or request.url.path.startswith(
            ("/docs", "/redoc", "/openapi")
        ):
            return await call_next(request)

        key = self._client(request)
        now = time.time()
        window_start = now - self.window
        hits = [t for t in self._hits[key] if t > window_start]

        limit = self.limit
        if request.url.path.endswith(("/login", "/login/json", "/register", "/forgot-password")):
            limit = 15  # stricter for auth surfaces

        if len(hits) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests, please slow down."},
            )
        hits.append(now)
        self._hits[key] = hits
        return await call_next(request)
