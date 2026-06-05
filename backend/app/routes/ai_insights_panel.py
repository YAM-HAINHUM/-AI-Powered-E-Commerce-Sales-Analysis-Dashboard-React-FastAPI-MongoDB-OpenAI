"""AI Insights Panel (non-chat).

Exposes a single endpoint returning:
- KPIs
- smart insights
- alerts
- recommendations
- mini charts (chart-ready payloads)

Phase 1/2 skeleton implementation.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.services.insights_panel_service import get_panel

router = APIRouter(prefix="/api/ai-insights", tags=["ai-insights"]) 


@router.get("/panel")
async def get_ai_insights_panel(current_user: dict = Depends(get_current_user)):
    tenant_id = current_user.get("tenant_id")
    return await get_panel(tenant_id=tenant_id)

