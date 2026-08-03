"""Aggregate all v1 endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    access_requests,
    admin,
    auth,
    citations,
    datasets,
    notifications,
    taxonomy,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(datasets.router)
api_router.include_router(access_requests.router)
api_router.include_router(notifications.router)
api_router.include_router(taxonomy.router)
api_router.include_router(citations.router)
api_router.include_router(admin.router)
