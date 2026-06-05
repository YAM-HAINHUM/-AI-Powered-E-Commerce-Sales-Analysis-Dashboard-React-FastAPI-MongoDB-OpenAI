"""
Pydantic schemas for request / response models.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field



# ── Auth ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    email: str
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Dashboard ─────────────────────────────────────────────────────────────────
class KPIData(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    avg_order_value: float
    revenue_growth: float
    orders_growth: float


# ── SQL Query ─────────────────────────────────────────────────────────────────
class SQLQueryRequest(BaseModel):
    query: str
    natural_language: Optional[str] = None


class SQLQueryResponse(BaseModel):
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    execution_time_ms: float
    query_used: str


# ── AI ────────────────────────────────────────────────────────────────────────
class AIInsightRequest(BaseModel):
    context: Optional[str] = None
    insight_type: str = "general"  # general | drop | improvement | summary


# ── Data Upload ───────────────────────────────────────────────────────────────
class UploadResponse(BaseModel):

    success: bool
    message: str
    records_inserted: int

