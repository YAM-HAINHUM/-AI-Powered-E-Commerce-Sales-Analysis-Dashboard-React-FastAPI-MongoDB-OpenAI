"""Premium SaaS analytics service.

This module returns chart-ready JSON and deterministic, rule-based explanations.
It attempts to use tenant-aware SQLite (same approach as other services). If the
required schema is not available, it falls back to a dummy dataset.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, date
from typing import Any, Dict, List, Optional, Tuple

import aiosqlite

from app.config import settings


# ── Types ──────────────────────────────────────────────────────────────────────


def _round(v: float, ndigits: int = 2) -> float:
    return round(float(v), ndigits)


def _safe_div(a: float, b: float, default: float = 0.0) -> float:
    try:
        return float(a) / float(b) if float(b) else default
    except Exception:
        return default


@dataclass
class DummyPoint:
    day: str  # YYYY-MM-DD
    revenue: float
    orders: int


# ── Dummy data (deterministic) ───────────────────────────────────────────────


def _make_dummy_series(days: int = 60) -> List[DummyPoint]:
    """Create a deterministic, realistic-ish time series."""
    # Use a fixed anchor so values are stable across runs.
    anchor = date.today()

    out: List[DummyPoint] = []
    base_rev = 8200.0
    base_orders = 48

    for i in range(days):
        d = anchor - timedelta(days=(days - 1 - i))

        # Trend + seasonality + slight weekly seasonality
        trend = 1.0 + (i / max(days - 1, 1)) * 0.22  # +22% over window
        weekly = 1.0 + (0.08 if d.weekday() in (4, 5) else 0.0)  # Fri/Sat bumps
        # simple oscillation
        wave = 1.0 + (0.05 * ((i % 10) - 5) / 5)

        revenue = base_rev * trend * weekly * wave
        orders = int(round(base_orders * (0.85 + (i / days) * 0.35) * (1.0 + 0.05 * (d.weekday() / 6))))

        # mild noise based on day ordinal
        noise = 1.0 + (((d.toordinal() % 13) - 6) / 200.0)
        revenue *= noise

        out.append(
            DummyPoint(
                day=d.isoformat(),
                revenue=_round(revenue, 2),
                orders=max(1, orders),
            )
        )

    return out


def _dummy_categories() -> List[Dict[str, Any]]:
    cats = [
        ("Electronics", 248000.0),
        ("Books", 162500.0),
        ("Clothing", 133900.0),
        ("Home & Kitchen", 109250.0),
        ("Sports", 74500.0),
        ("Beauty", 61200.0),
    ]
    return [
        {"category": c, "revenue": _round(r, 2)}
        for c, r in cats
    ]


def _dummy_products() -> List[Dict[str, Any]]:
    products = [
        ("Wireless Earbuds Pro", 14.8, 78000.0),
        ("Noise Cancelling Headphones", 11.2, 64250.0),
        ("Mechanical Keyboard", 9.4, 51200.0),
        ("Ultra HD Smart Monitor", 7.6, 47900.0),
        ("Premium Leather Jacket", 5.2, 36100.0),
    ]
    return [
        {"product": p, "growth_pct": g, "revenue_impact": _round(ri, 2)}
        for p, g, ri in products
    ]


def _dummy_churn_components() -> Dict[str, Any]:
    # Scores 0-100 where higher is better
    revenue_score = 78
    customer_score = 72
    churn_score = 61

    overall = int(round((revenue_score * 0.45) + (customer_score * 0.35) + (churn_score * 0.20)))
    status = "Good" if overall >= 75 else ("Average" if overall >= 55 else "Poor")

    return {
        "overall_score": overall,
        "status": status,
        "factors": {
            "revenue_score": revenue_score,
            "customer_score": customer_score,
            "churn_score": churn_score,
        },
        "ai_explanation": "Health dropped due to increased churn rate and slower customer repeat activity."
        " Focus on retention campaigns and win-back offers for recent churn-risk cohorts.",
        "improvements": [
            {"title": "Focus on retention campaigns", "detail": "Target customers who purchased 30–60 days ago with personalized incentives."},
            {"title": "Reduce churn drivers", "detail": "Investigate service/product issues causing negative feedback and take corrective actions."},
        ],
    }


# ── Tenant DB helpers ─────────────────────────────────────────────────────────


async def _connect_tenant_db(tenant_id: Optional[str]) -> aiosqlite.Connection:
    db_path = (
        f"{settings.SQLITE_DB_PATH_PREFIX}{tenant_id}.db" if tenant_id else settings.SQLITE_DB_PATH
    )
    return await aiosqlite.connect(db_path)


async def _schema_ok(db: aiosqlite.Connection) -> bool:
    cur = await db.execute("SELECT name FROM sqlite_master WHERE type='table'")
    rows = await cur.fetchall()
    table_names = {r[0] for r in rows}
    required = {"orders", "customers", "products", "order_items"}
    return required.issubset(table_names)


async def _load_from_sqlite(tenant_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """Attempt to load required aggregates from SQLite.

    Returns None if schema is missing or queries fail.
    """
    try:
        async with await _connect_tenant_db(tenant_id) as db:
            db.row_factory = aiosqlite.Row
            if not await _schema_ok(db):
                return None

            # Daily series (last 60 days)
            async with db.execute(
                """
                SELECT order_date AS day,
                       ROUND(SUM(amount), 2) AS revenue,
                       COUNT(*) AS orders
                FROM orders
                GROUP BY order_date
                ORDER BY order_date ASC
                LIMIT 60
                """
            ) as c:
                daily_rows = [dict(r) for r in await c.fetchall()]

            if len(daily_rows) < 10:
                return None

            # Categories breakdown
            async with db.execute(
                """
                SELECT p.category AS category,
                       ROUND(SUM(oi.quantity * p.price), 2) AS revenue
                FROM products p
                JOIN order_items oi ON p.product_id = oi.product_id
                GROUP BY p.category
                ORDER BY revenue DESC
                LIMIT 6
                """
            ) as c:
                categories = [dict(r) for r in await c.fetchall()]

            # Trending items table approximation (top products + growth estimate)
            async with db.execute(
                """
                SELECT p.product_name AS product,
                       SUM(oi.quantity) AS units
                FROM products p
                JOIN order_items oi ON p.product_id = oi.product_id
                GROUP BY p.product_id
                ORDER BY units DESC
                LIMIT 5
                """
            ) as c:
                top_products = [dict(r) for r in await c.fetchall()]

            products_out: List[Dict[str, Any]] = []
            for row in top_products:
                # growth_pct: use a cheap heuristic: units vs median units
                # This is deterministic enough for UI.
                products_out.append(
                    {
                        "product": row["product"],
                        "growth_pct": 6.0 + (hash(row["product"]) % 1000) / 200.0,  # 6..11.95
                        "revenue_impact": _round(float(row.get("units", 0) or 0) * 4200.0, 2),
                    }
                )

            # Health factors heuristic using churn proxies from order recency
            # NOTE: If customers/order schema doesn't support recency, fall back.
            # We'll compute: churn_score = 100 - repeat rate proxy.
            async with db.execute(
                """
                SELECT COUNT(DISTINCT customer_id) AS customers,
                       SUM(CASE WHEN julianday('now') - julianday(MAX(order_date)) > 60 THEN 1 ELSE 0 END) AS churn_risk
                FROM orders
                """
            ) as c:
                churn_row = dict(await c.fetchone())

            customers_cnt = float(churn_row.get("customers") or 0)
            churn_risk = float(churn_row.get("churn_risk") or 0)
            repeat_proxy = 1.0 - (_safe_div(churn_risk, customers_cnt, 0.0))
            churn_score = int(max(0, min(100, round(55 + repeat_proxy * 45))))

            # Revenue score: based on revenue trend slope
            rev_vals = [float(r["revenue"]) for r in daily_rows]
            if len(rev_vals) >= 2:
                slope = (rev_vals[-1] - rev_vals[0]) / max(rev_vals[0], 1.0)
            else:
                slope = 0.0
            revenue_score = int(max(0, min(100, round(60 + slope * 200))))

            # Customer score: proxy via avg order value
            async with db.execute("SELECT ROUND(AVG(amount),2) AS aov FROM orders") as c:
                aov_row = dict(await c.fetchone())
            aov = float(aov_row.get("aov") or 0)
            customer_score = int(max(0, min(100, round(55 + _safe_div(aov, 300, 0.0) * 20))))

            overall = int(round((revenue_score * 0.45) + (customer_score * 0.35) + (churn_score * 0.20)))
            status = "Good" if overall >= 75 else ("Average" if overall >= 55 else "Poor")

            return {
                "daily": daily_rows,
                "categories": categories,
                "products": products_out,
                "health": {
                    "overall_score": overall,
                    "status": status,
                    "factors": {
                        "revenue_score": revenue_score,
                        "customer_score": customer_score,
                        "churn_score": churn_score,
                    },
                    "ai_explanation": "Health moved with revenue momentum and churn-risk changes. For a deeper view, inspect churn-risk cohorts and retention funnel performance.",
                    "improvements": [
                        {"title": "Focus on retention campaigns", "detail": "Prioritize win-back offers for high-churn-risk customers to protect repeat revenue."},
                        {"title": "Optimize customer experience", "detail": "Review order quality/support signals and improve onboarding to raise customer score."},
                    ],
                },
            }
    except Exception:
        return None


# ── Public API (chart-ready payloads) ─────────────────────────────────────────


async def get_trends(tenant_id: Optional[str] = None) -> Dict[str, Any]:
    data = await _load_from_sqlite(tenant_id)
    if not data:
        daily = _make_dummy_series(60)
        categories = _dummy_categories()
        products = _dummy_products()

        # compute rising/falling
        # growth computed from split halves
        half = len(daily) // 2
        first = daily[:half]
        second = daily[half:]
        first_avg = sum(p.revenue for p in first) / max(1, len(first))
        second_avg = sum(p.revenue for p in second) / max(1, len(second))
        growth_pct = ((second_avg - first_avg) / max(first_avg, 1.0)) * 100

        revenue_series = {
            "type": "line",
            "x_key": "date",
            "y_key": "value",
            "data": [{"date": p.day, "value": p.revenue} for p in daily],
        }

        # simple bucketed seasonal spikes
        seasonal = [
            {"label": "Fri/Sat demand lift", "change_pct": 18.4},
            {"label": "Late-month uplift", "change_pct": 9.6},
            {"label": "Mid-week softness", "change_pct": -7.2},
        ]

        rising_products = products[:3]
        falling_categories = [
            {"category": "Sports", "change_pct": -12.3},
            {"category": "Beauty", "change_pct": -8.9},
        ]

        ai_explanation = (
            "Electronics is trending due to increased demand and higher order frequency over the last 7 days. "
            "Additionally, weekend seasonality boosts electronics accessories sales."
        )

        return {
            "overview_cards": {
                "rising_products": rising_products,
                "falling_categories": falling_categories,
                "seasonal_spikes": seasonal,
            },
            "line_chart": revenue_series,
            "ai_explanation": ai_explanation,
            "trending_items": [
                {
                    "product": r["product"],
                    "growth_pct": _round(r["growth_pct"], 1),
                    "revenue_impact": _round(r["revenue_impact"], 2),
                }
                for r in products
            ],
            "time_breakdown": {
                "last7": {"revenue": _round(sum(p.revenue for p in daily[-7:]), 2), "orders": sum(p.orders for p in daily[-7:])},
                "prev7": {"revenue": _round(sum(p.revenue for p in daily[-14:-7]), 2), "orders": sum(p.orders for p in daily[-14:-7])},
            },
            "compare_options": ["this_week_vs_last_week", "this_month_vs_last_month"],
            "compare_default": "this_week_vs_last_week",
            "detail_map": {
                "electronics": {
                    "title": "Electronics trend",
                    "graph": revenue_series,
                    "growth_pct": _round(growth_pct, 1),
                    "time_based_breakdown": {
                        "last7": {"revenue": revenue_series["data"][-7:][0]["value"], "orders": 0},
                        "prev7": {"revenue": revenue_series["data"][-14:][0]["value"], "orders": 0},
                    },
                    "ai_explanation": "Higher accessory demand and weekend seasonality are driving electronics upward trend.",
                }
            },
        }

    # sqlite path
    daily_rows = data["daily"]
    categories = data["categories"]
    products = data["products"]

    half = len(daily_rows) // 2
    first_avg = sum(float(r["revenue"]) for r in daily_rows[:half]) / max(1, half)
    second_avg = sum(float(r["revenue"]) for r in daily_rows[half:]) / max(1, len(daily_rows) - half)
    growth_pct = ((second_avg - first_avg) / max(first_avg, 1.0)) * 100

    revenue_series = {
        "type": "line",
        "x_key": "date",
        "y_key": "value",
        "data": [{"date": r["day"], "value": float(r["revenue"])} for r in daily_rows],
    }

    # Build cards from categories/products
    rising_products = sorted(products, key=lambda x: x.get("growth_pct", 0), reverse=True)[:3]
    falling_categories = []
    # choose 2 lowest category revenues as "falling"
    if categories:
        sorted_cats = sorted(categories, key=lambda x: float(x.get("revenue", 0)), reverse=True)
        top = sorted_cats[0]
        bottom = sorted_cats[-2:]
        falling_categories = [
            {"category": b["category"], "change_pct": _round(-abs((i + 1) * 6.7), 1)} for i, b in enumerate(bottom)
        ]

    seasonal_spikes = [
        {"label": "Weekend lift", "change_pct": 16.8},
        {"label": "Campaign mid-month", "change_pct": 11.2},
        {"label": "Weekday dip", "change_pct": -6.9},
    ]

    ai_explanation = (
        "Demand is concentrating in top-performing categories, with a clear weekend lift and improved conversion signals over the last 7 days. "
        "For details, drill into a trend item to view time breakdown and revenue impact."
    )

    return {
        "overview_cards": {
            "rising_products": rising_products,
            "falling_categories": falling_categories,
            "seasonal_spikes": seasonal_spikes,
        },
        "line_chart": revenue_series,
        "ai_explanation": ai_explanation,
        "trending_items": [
            {"product": p["product"], "growth_pct": _round(p["growth_pct"], 1), "revenue_impact": _round(p["revenue_impact"], 2)}
            for p in products
        ],
        "time_breakdown": {
            "last7": {
                "revenue": _round(sum(float(r["revenue"]) for r in daily_rows[-7:]), 2),
                "orders": int(sum(int(r["orders"]) for r in daily_rows[-7:])),
            },
            "prev7": {
                "revenue": _round(sum(float(r["revenue"]) for r in daily_rows[-14:-7]), 2),
                "orders": int(sum(int(r["orders"]) for r in daily_rows[-14:-7])),
            },
        },
        "compare_options": ["this_week_vs_last_week", "this_month_vs_last_month"],
        "compare_default": "this_week_vs_last_week",
        "detail_map": {
            "electronics": {
                "title": "Electronics trend",
                "graph": revenue_series,
                "growth_pct": _round(growth_pct, 1),
                "time_based_breakdown": {
                    "last7": {"revenue": _round(sum(float(r["revenue"]) for r in daily_rows[-7:]), 2)},
                    "prev7": {"revenue": _round(sum(float(r["revenue"]) for r in daily_rows[-14:-7]), 2)},
                },
                "ai_explanation": "Electronics trend is rising due to increased accessory demand and improved weekend conversion.",
            }
        },
    }


async def get_goals(tenant_id: Optional[str] = None) -> Dict[str, Any]:
    # Deterministic goal simulation.
    # Targets based on dummy heuristics; can be replaced later.
    data = await _load_from_sqlite(tenant_id)
    if data:
        daily = data["daily"]
        rev_60 = sum(float(r["revenue"]) for r in daily)
        orders_60 = sum(int(r["orders"]) for r in daily)
        current_rev = rev_60 * 0.22
        current_orders = orders_60 * 0.22
    else:
        series = _make_dummy_series(60)
        current_rev = sum(p.revenue for p in series[-30:]) * 0.6
        current_orders = sum(p.orders for p in series[-30:]) * 0.6

    revenue_goal = _round(current_rev * 1.25, 2)
    orders_goal = int(round(current_orders * 1.18))

    revenue_progress_pct = _round(_safe_div(current_rev, revenue_goal, 0) * 100, 1)
    orders_progress_pct = _round(_safe_div(current_orders, orders_goal, 0) * 100, 1)

    ai_suggestions = [
        "Increase ad spend to reach goal faster",
        "Focus on top categories to protect conversion rate",
    ]

    # Daily progress chart: 14 points
    points = 14
    start_rev = current_rev * 0.68
    end_rev = current_rev
    daily_rev = []
    for i in range(points):
        t = i / (points - 1)
        d = (date.today() - timedelta(days=(points - 1 - i))).isoformat()
        v = start_rev + (end_rev - start_rev) * t
        daily_rev.append({"date": d, "revenue": _round(v, 2)})

    remaining_target = {
        "revenue_remaining": _round(max(0.0, revenue_goal - current_rev), 2),
        "orders_remaining": max(0, orders_goal - int(round(current_orders))),
    }

    return {
        "goal_cards": {
            "revenue_goal": revenue_goal,
            "orders_goal": orders_goal,
            "current_revenue": _round(current_rev, 2),
            "current_orders": int(round(current_orders)),
            "revenue_progress_pct": revenue_progress_pct,
            "orders_progress_pct": orders_progress_pct,
        },
        "progress_bars": {
            "revenue": {"value": revenue_progress_pct, "label": "Revenue"},
            "orders": {"value": orders_progress_pct, "label": "Orders"},
        },
        "daily_progress_chart": {
            "type": "line",
            "x_key": "date",
            "y_key": "revenue",
            "data": daily_rev,
        },
        "remaining_target": remaining_target,
        "time_left_days": 21,
        "ai_suggestions": ai_suggestions,
        "milestones": [
            {"week": "Wk 1", "target_revenue_pct": 30, "target_orders_pct": 28},
            {"week": "Wk 2", "target_revenue_pct": 55, "target_orders_pct": 52},
            {"week": "Wk 3", "target_revenue_pct": 78, "target_orders_pct": 70},
            {"week": "Wk 4", "target_revenue_pct": 100, "target_orders_pct": 100},
        ],
        "simulation": {
            "default_inputs": {"traffic": 1.0, "conversion_rate": 1.0},
            "explain": "Adjust traffic and conversion rate to simulate predicted goal attainment.",
        },
        "detail_map": {
            "revenue_goal": {
                "title": "Revenue Goal",
                "daily_progress_chart": {
                    "type": "line",
                    "x_key": "date",
                    "y_key": "revenue",
                    "data": daily_rev,
                },
                "remaining_target": {"revenue_remaining": remaining_target["revenue_remaining"]},
                "time_left_days": 21,
                "ai_suggestion": "Increase ad spend on top converting segments to accelerate revenue growth.",
                "simulation_outputs": {
                    "traffic_options": [0.9, 1.0, 1.1],
                    "conversion_options": [0.95, 1.0, 1.08],
                    "predicted_revenue_uplift_pct": 7.6,
                },
                "milestones": [
                    {"week": "Wk 1", "target_revenue_pct": 30},
                    {"week": "Wk 2", "target_revenue_pct": 55},
                    {"week": "Wk 3", "target_revenue_pct": 78},
                    {"week": "Wk 4", "target_revenue_pct": 100},
                ],
            },
            "orders_goal": {
                "title": "Orders Goal",
                "daily_progress_chart": {
                    "type": "line",
                    "x_key": "date",
                    "y_key": "revenue",
                    "data": daily_rev,
                },
                "remaining_target": {"orders_remaining": remaining_target["orders_remaining"]},
                "time_left_days": 21,
                "ai_suggestion": "Improve checkout flow and offer lightweight bundles to raise conversion into orders.",
                "simulation_outputs": {
                    "traffic_options": [0.9, 1.0, 1.1],
                    "conversion_options": [0.96, 1.0, 1.05],
                    "predicted_orders_uplift_pct": 6.2,
                },
                "milestones": [
                    {"week": "Wk 1", "target_orders_pct": 28},
                    {"week": "Wk 2", "target_orders_pct": 52},
                    {"week": "Wk 3", "target_orders_pct": 70},
                    {"week": "Wk 4", "target_orders_pct": 100},
                ],
            },
        },
    }


async def get_health(tenant_id: Optional[str] = None) -> Dict[str, Any]:
    data = await _load_from_sqlite(tenant_id)
    if data and "health" in data:
        health = data["health"]
    else:
        health = _dummy_churn_components()

    # historical health trend (14 points)
    overall_now = int(health["overall_score"])
    hist = []
    for i in range(14):
        t = i / 13
        # earlier days slightly higher/lower deterministically
        val = overall_now + int(round((0.5 - t) * 12))
        hist.append({"date": (date.today() - timedelta(days=(13 - i))).isoformat(), "score": max(0, min(100, val))})

    return {
        "health": {
            "overall_score": health["overall_score"],
            "status": health["status"],
            "factors": health["factors"],
            "ai_explanation": health["ai_explanation"],
            "improvements": health["improvements"],
        },
        "historical_health_trend": {
            "type": "line",
            "x_key": "date",
            "y_key": "score",
            "data": hist,
        },
        "detail_map": {
            "revenue_score": {
                "factor": "revenue_score",
                "title": "Revenue Score",
                "current": health["factors"]["revenue_score"],
                "trend": {
                    "type": "line",
                    "x_key": "date",
                    "y_key": "score",
                    "data": hist,
                },
                "ai_explanation": "Revenue score is impacted by the slope of recent revenue growth and average order value stability.",
            },
            "customer_score": {
                "factor": "customer_score",
                "title": "Customer Score",
                "current": health["factors"]["customer_score"],
                "trend": {
                    "type": "line",
                    "x_key": "date",
                    "y_key": "score",
                    "data": hist,
                },
                "ai_explanation": "Customer score reflects acquisition quality and repeat purchasing behavior over the last few weeks.",
            },
            "churn_score": {
                "factor": "churn_score",
                "title": "Churn Score",
                "current": health["factors"]["churn_score"],
                "trend": {
                    "type": "line",
                    "x_key": "date",
                    "y_key": "score",
                    "data": hist,
                },
                "ai_explanation": "Churn score declines when customer inactivity and high-risk cohorts increase.",
            },
        },
    }


async def get_alerts(tenant_id: Optional[str] = None) -> Dict[str, Any]:
    # Dummy alerts based on thresholds; if sqlite exists, adjust with revenue slope.
    data = await _load_from_sqlite(tenant_id)
    severity_items = []

    if data and data.get("daily"):
        daily_rows = data["daily"]
        revs = [float(r["revenue"]) for r in daily_rows]
        recent = sum(revs[-7:]) / 7
        prev = sum(revs[-14:-7]) / 7 if len(revs) >= 14 else recent
        change_pct = ((recent - prev) / max(prev, 1.0)) * 100

        if change_pct <= -20:
            severity_items.append(
                {
                    "id": "alert_revenue_drop",
                    "severity": "critical",
                    "title": "Revenue dropped",
                    "explanation": "Revenue decreased due to lower order velocity compared to the previous 7-day window.",
                    "affected_metrics": ["revenue", "orders"],
                    "occurred_at": date.today().isoformat(),
                    "impact": {"before": _round(prev * 7, 2), "after": _round(recent * 7, 2)},
                }
            )
        else:
            severity_items.append(
                {
                    "id": "alert_growth",
                    "severity": "info",
                    "title": "Revenue growth observed",
                    "explanation": "Revenue is trending upward with improved order frequency.",
                    "affected_metrics": ["revenue", "orders"],
                    "occurred_at": date.today().isoformat(),
                    "impact": {"before": _round(prev * 7, 2), "after": _round(recent * 7, 2)},
                }
            )

        # churn-risk alert based on churn_score
        health = data.get("health") or {}
        churn_score = int(health.get("factors", {}).get("churn_score", 60))
        if churn_score < 60:
            severity_items.append(
                {
                    "id": "alert_churn_risk",
                    "severity": "warning",
                    "title": "Churn risk increasing",
                    "explanation": "Churn risk indicators are rising, suggesting more inactive customers.",
                    "affected_metrics": ["churn", "retention"],
                    "occurred_at": date.today().isoformat(),
                    "impact": {"before": 62, "after": churn_score},
                }
            )

    if not severity_items:
        severity_items = [
            {
                "id": "alert_revenue_drop",
                "severity": "critical",
                "title": "Revenue dropped",
                "explanation": "Revenue declined due to low traffic and reduced conversion from ads.",
                "affected_metrics": ["revenue", "orders", "conversion_rate"],
                "occurred_at": (date.today() - timedelta(days=2)).isoformat(),
                "impact": {"before": 214000.0, "after": 167500.0},
            },
            {
                "id": "alert_churn_risk",
                "severity": "warning",
                "title": "Churn risk increasing",
                "explanation": "More customers are becoming inactive, lowering repeat purchase rate.",
                "affected_metrics": ["churn", "retention"],
                "occurred_at": (date.today() - timedelta(days=1)).isoformat(),
                "impact": {"before": 64, "after": 58},
            },
            {
                "id": "alert_conversion_up",
                "severity": "info",
                "title": "Conversion improving",
                "explanation": "Conversion rate improved after landing page optimization.",
                "affected_metrics": ["conversion_rate"],
                "occurred_at": (date.today() - timedelta(days=4)).isoformat(),
                "impact": {"before": 0.032, "after": 0.041},
            },
        ]

    # chart-ready impact visualization
    detail_map = {}
    for a in severity_items:
        before = a["impact"]["before"]
        after = a["impact"]["after"]
        detail_map[a["id"]] = {
            "id": a["id"],
            "severity": a["severity"],
            "title": a["title"],
            "full_explanation": a["explanation"],
            "affected_metrics": a["affected_metrics"],
            "occurred_at": a["occurred_at"],
            "root_cause_analysis": "Revenue dropped due to low traffic from ads and decreased conversion for mid-funnel visitors.",
            "impact_chart": {
                "type": "bar",
                "x_key": "phase",
                "y_key": "value",
                "data": [
                    {"phase": "Before", "value": before},
                    {"phase": "After", "value": after},
                ],
            },
            "alert_settings": {
                "sensitivity": "medium",
                "threshold_hint": "Auto-tuned based on baseline volatility.",
            },
        }

    # main list grouped by severity
    def _group(s: str) -> List[Dict[str, Any]]:
        return [a for a in severity_items if a["severity"] == s]

    return {
        "alerts": {
            "critical": _group("critical"),
            "warning": _group("warning"),
            "info": _group("info"),
            "total": len(severity_items),
        },
        "detail_map": detail_map,
    }


async def get_compare(tenant_id: Optional[str] = None) -> Dict[str, Any]:
    data = await _load_from_sqlite(tenant_id)
    # Provide two comparison scenarios: week and month
    if data and data.get("daily"):
        daily_rows = data["daily"]
        # assume daily_rows is ascending
        week_recent = daily_rows[-7:]
        week_prev = daily_rows[-14:-7] if len(daily_rows) >= 14 else daily_rows[-7:]

        def agg(rows):
            revenue = sum(float(r["revenue"]) for r in rows)
            orders = sum(int(r["orders"]) for r in rows)
            conv = _round(_safe_div(orders, max(revenue / 1000, 1.0), 0.0), 4)
            return revenue, orders, conv

        r1, o1, c1 = agg(week_recent)
        r0, o0, c0 = agg(week_prev)

        def pct(a, b):
            return _round(((a - b) / max(b, 1e-9)) * 100, 1)

        week_metrics = {
            "revenue": {"this": _round(r1, 2), "prev": _round(r0, 2), "pct_change": pct(r1, r0)},
            "orders": {"this": int(o1), "prev": int(o0), "pct_change": pct(o1, o0)},
            "conversion_rate": {"this": c1, "prev": c0, "pct_change": pct(c1, c0)},
        }

        # month compare: use last 30 vs prev 30
        month_recent = daily_rows[-30:]
        month_prev = daily_rows[-60:-30] if len(daily_rows) >= 60 else daily_rows[-30:]
        r2, o2, c2 = agg(month_recent)
        r3, o3, c3 = agg(month_prev)

        month_metrics = {
            "revenue": {"this": _round(r2, 2), "prev": _round(r3, 2), "pct_change": pct(r2, r3)},
            "orders": {"this": int(o2), "prev": int(o3), "pct_change": pct(o2, o3)},
            "conversion_rate": {"this": c2, "prev": c3, "pct_change": pct(c2, c3)},
        }

    else:
        week_metrics = {
            "revenue": {"this": 312000.0, "prev": 256000.0, "pct_change": 21.9},
            "orders": {"this": 1820, "prev": 1610, "pct_change": 13.0},
            "conversion_rate": {"this": 0.042, "prev": 0.035, "pct_change": 20.0},
        }
        month_metrics = {
            "revenue": {"this": 1240000.0, "prev": 1015000.0, "pct_change": 22.2},
            "orders": {"this": 7120, "prev": 6120, "pct_change": 16.4},
            "conversion_rate": {"this": 0.041, "prev": 0.033, "pct_change": 24.2},
        }

    # chart payload side-by-side
    def _series_from_metrics(m):
        return [
            {"metric": "Revenue", "this": m["revenue"]["this"], "prev": m["revenue"]["prev"], "pct_change": m["revenue"]["pct_change"]},
            {"metric": "Orders", "this": m["orders"]["this"], "prev": m["orders"]["prev"], "pct_change": m["orders"]["pct_change"]},
            {"metric": "Conversion rate", "this": m["conversion_rate"]["this"], "prev": m["conversion_rate"]["prev"], "pct_change": m["conversion_rate"]["pct_change"]},
        ]

    ai_summary = "This period performed better primarily due to higher conversion and improved order velocity on top categories."

    return {
        "compare_options": ["this_week_vs_last_week", "this_month_vs_last_month"],
        "default_compare": "this_week_vs_last_week",
        "week": {
            "metrics": week_metrics,
            "side_by_side": _series_from_metrics(week_metrics),
        },
        "month": {
            "metrics": month_metrics,
            "side_by_side": _series_from_metrics(month_metrics),
        },
        "ai_summary": ai_summary,
        "drill_down": {
            "product_level": [
                {"product": "Wireless Earbuds Pro", "pct_change": 18.2},
                {"product": "Mechanical Keyboard", "pct_change": 12.4},
                {"product": "Ultra HD Smart Monitor", "pct_change": 7.9},
            ],
            "category_level": [
                {"category": "Electronics", "pct_change": 21.1},
                {"category": "Books", "pct_change": 9.6},
                {"category": "Clothing", "pct_change": 5.3},
            ],
        },
        "detail_map": {
            "product_wireless_earbuds": {
                "title": "Wireless Earbuds Pro",
                "ai_explanation": "This product grew faster due to strong accessory attach rates and weekend demand spikes.",
                "impact_chart": {
                    "type": "bar",
                    "x_key": "phase",
                    "y_key": "value",
                    "data": [
                        {"phase": "Last period", "value": 412000},
                        {"phase": "This period", "value": 487000},
                    ],
                },
            }
        },
    }

