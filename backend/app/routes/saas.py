"""Premium AI SaaS routes.

These endpoints power the deep SaaS pages:
- /api/trends
- /api/goals
- /api/health
- /api/alerts
- /api/compare

All responses are deterministic and chart-ready so the frontend can render
without extra transformations.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.services.saas_service import (
    get_alerts,
    get_compare,
    get_goals,
    get_health,
    get_trends,
)

router = APIRouter(prefix="/api", tags=["saas"])


def _tenant_id(user: dict) -> str | None:
    return user.get("tenant_id")


@router.get("/trends")
async def trends(current_user: dict = Depends(get_current_user)):
    return await get_trends(tenant_id=_tenant_id(current_user))


@router.get("/goals")
async def goals(current_user: dict = Depends(get_current_user)):
    return await get_goals(tenant_id=_tenant_id(current_user))


@router.get("/health")
async def health(current_user: dict = Depends(get_current_user)):
    return await get_health(tenant_id=_tenant_id(current_user))


@router.get("/alerts")
async def alerts(current_user: dict = Depends(get_current_user)):
    return await get_alerts(tenant_id=_tenant_id(current_user))


@router.get("/compare")
async def compare(current_user: dict = Depends(get_current_user)):
    return await get_compare(tenant_id=_tenant_id(current_user))

