"""AI Insights Panel service (non-chat).

Phase 1/2 skeleton:
- Provides panel-ready KPIs, trend summary, basic insights, alerts, and chart payloads.
- Uses tenant-aware SQLite for now.

Later phases will add:
- LLM enhancement (optional Groq/OpenAI)
- Better anomaly logic and deterministic recommendations
"""
from __future__ import annotations

from typing import Any
import aiosqlite
from datetime import datetime, timedelta

from app.config import settings


async def _connect_tenant_db(tenant_id: str | None):
    db_path = (
        f"{settings.SQLITE_DB_PATH_PREFIX}{tenant_id}.db" if tenant_id else settings.SQLITE_DB_PATH
    )
    return await aiosqlite.connect(db_path)


async def get_panel(tenant_id: str | None = None) -> dict[str, Any]:
    async with await _connect_tenant_db(tenant_id) as db:
        db.row_factory = aiosqlite.Row

        # KPIs + growth (naive MoM from monthly buckets)
        async with db.execute(
            "SELECT SUM(amount) AS rev, COUNT(*) AS orders FROM orders"
        ) as c:
            kpi_row = dict(await c.fetchone())

        async with db.execute(
            "SELECT COUNT(DISTINCT customer_id) AS customers FROM orders"
        ) as c:
            customers_row = dict(await c.fetchone())

        total_rev = float(kpi_row.get("rev") or 0)
        total_orders = int(kpi_row.get("orders") or 0)
        total_customers = int(customers_row.get("customers") or 0)
        aov = round(total_rev / total_orders, 2) if total_orders else 0.0

        # Monthly trend
        async with db.execute(
            """
            SELECT strftime('%Y-%m', order_date) AS month,
                   ROUND(SUM(amount), 2) AS revenue
            FROM orders
            GROUP BY month
            ORDER BY month DESC
            LIMIT 2
            """
        ) as c:
            last2 = [dict(r) for r in await c.fetchall()]

        revenue_growth = 0.0
        if len(last2) == 2:
            # last2 is desc; idx0=latest, idx1=previous
            prev = float(last2[1].get("revenue") or 0)
            curr = float(last2[0].get("revenue") or 0)
            revenue_growth = round(((curr - prev) / prev) * 100, 1) if prev else 0.0

        # Best city (by revenue)
        async with db.execute(
            """
            SELECT c.city AS city, ROUND(SUM(o.amount), 2) AS revenue
            FROM customers c
            JOIN orders o ON c.customer_id = o.customer_id
            GROUP BY c.city
            ORDER BY revenue DESC
            LIMIT 1
            """
        ) as c:
            best_city_row = dict(await c.fetchone())
        best_city = best_city_row.get("city") or "Unknown"

        # Top category (by revenue)
        async with db.execute(
            """
            SELECT p.category AS category, ROUND(SUM(oi.quantity * p.price), 2) AS revenue
            FROM products p
            JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.category
            ORDER BY revenue DESC
            LIMIT 1
            """
        ) as c:
            top_cat_row = dict(await c.fetchone())
        top_category = top_cat_row.get("category") or "Unknown"

        # Trend charts: last 30 days actual revenue
        async with db.execute(
            """
            SELECT order_date AS date, ROUND(SUM(amount), 2) AS revenue
            FROM orders
            GROUP BY order_date
            ORDER BY order_date ASC
            LIMIT 30
            """
        ) as c:
            daily = [dict(r) for r in await c.fetchall()]

        line_chart = {
            "type": "line",
            "x_key": "date",
            "y_key": "revenue",
            "data": [
                {"date": r["date"], "revenue": r["revenue"]} for r in daily
            ],
        }

        # Category distribution
        async with db.execute(
            """
            SELECT p.category AS category, ROUND(SUM(oi.quantity * p.price), 2) AS revenue
            FROM products p
            JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.category
            ORDER BY revenue DESC
            LIMIT 6
            """
        ) as c:
            cats = [dict(r) for r in await c.fetchall()]

        bar_chart = {
            "type": "bar",
            "x_key": "category",
            "y_key": "revenue",
            "data": [
                {"category": r["category"], "revenue": r["revenue"]} for r in cats
            ],
        }

        pie_chart = {
            "type": "pie",
            "name_key": "category",
            "value_key": "revenue",
            "data": [
                {"name": r["category"], "value": r["revenue"]} for r in cats
            ],
        }

        # Simple spike/drop detection using last 7 vs prev 7 days
        async with db.execute(
            """
            SELECT order_date AS date, ROUND(SUM(amount), 2) AS revenue
            FROM orders
            GROUP BY order_date
            ORDER BY order_date DESC
            LIMIT 14
            """
        ) as c:
            last14 = [dict(r) for r in await c.fetchall()]

        spike_alerts: list[dict[str, Any]] = []
        if len(last14) >= 14:
            # last14 is desc; first 7 are most recent
            recent7 = [float(r["revenue"]) for r in last14[:7]]
            prev7 = [float(r["revenue"]) for r in last14[7:14]]
            recent_avg = sum(recent7) / 7
            prev_avg = sum(prev7) / 7

            if prev_avg > 0:
                change_pct = ((recent_avg - prev_avg) / prev_avg) * 100
                if change_pct <= -20:
                    spike_alerts.append(
                        {
                            "severity": "critical" if change_pct <= -30 else "high",
                            "type": "revenue_drop",
                            "message": f"Revenue dropped by {abs(round(change_pct,1))}% (7d avg vs previous 7d).",
                        }
                    )
                elif change_pct >= 30:
                    spike_alerts.append(
                        {
                            "severity": "critical" if change_pct >= 50 else "high",
                            "type": "sales_spike",
                            "message": f"Sales spiked by {round(change_pct,1)}% (7d avg vs previous 7d).",
                        }
                    )

        recommendations = [
            {
                "title": "Double down on your top category",
                "detail": f"Focus budget on {top_category} — it is currently driving the highest revenue.",
                "impact_estimate": "+3-7% revenue potential",
            },
            {
                "title": "City-specific optimization",
                "detail": f"Deploy targeted promotions in {best_city} to improve conversion and reduce CAC.",
                "impact_estimate": "+2-5% order uplift",
            },
        ]

        return {
            "kpis": {
                "revenue": round(total_rev, 2),
                "orders": total_orders,
                "aov": round(aov, 2),
                "growth_pct": revenue_growth,
            },
            "smart_insights": {
                "top_category": top_category,
                "best_city": best_city,
                "trend_summary": "Revenue trend computed from latest 2 months (skeleton).",
            },
            "alerts": {
                "items": spike_alerts,
                "last_evaluated_at": datetime.utcnow().isoformat() + "Z",
            },
            "recommendations": recommendations,
            "mini_charts": {
                "line_revenue_trend": line_chart,
                "bar_category_revenue": bar_chart,
                "pie_category_distribution": pie_chart,
            },
        }

