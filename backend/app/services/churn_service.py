"""
Churn Prediction Service — calculates customer churn risk based on purchasing recency and order counts.
"""
from __future__ import annotations
import aiosqlite
import numpy as np
from datetime import datetime
from app.config import settings

async def predict_churn() -> dict:
    """
    Analyzes customer database and predicts churn probability.
    Returns customer lists with risk badges and summary statistics.
    """
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT
                c.customer_id,
                c.name,
                c.city,
                COUNT(o.order_id)          AS frequency,
                MAX(o.order_date)          AS last_order_date,
                ROUND(SUM(o.amount), 2)    AS total_spent
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            GROUP BY c.customer_id
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    if not rows:
        return {"customers": [], "summary": {"total_customers": 0, "high_risk_count": 0}}

    today = datetime.now()
    scored_customers = []

    for r in rows:
        # 1. Recency Calculation
        if r["last_order_date"]:
            last_dt = datetime.strptime(r["last_order_date"], "%Y-%m-%d")
            recency_days = (today - last_dt).days
        else:
            recency_days = 999  # No orders at all

        # 2. Probability model:
        # Base probability escalates based on days inactive.
        if recency_days > 120:
            base_prob = 85.0
            factor = min(15.0, (recency_days - 120) * 0.05)
            prob = base_prob + factor
            badge = "high"
            reason = "No purchase activity for 4+ months"
        elif recency_days > 60:
            prob = 55.0 + (recency_days - 60) * 0.5
            badge = "medium"
            reason = "Inactive for 2-4 months; customer behavior fading"
        elif recency_days > 30:
            prob = 25.0 + (recency_days - 30) * 1.0
            badge = "low"
            reason = "Slightly inactive; typical purchase gap"
        else:
            # Active recently (under 30 days)
            # Probability drops further if they order frequently
            freq_factor = min(15.0, (r["frequency"] or 0) * 2.0)
            prob = max(3.0, 15.0 - freq_factor)
            badge = "low"
            reason = "Recent purchaser with healthy activity"

        # Special case: customer has zero orders
        if not r["last_order_date"]:
            prob = 95.0
            badge = "high"
            reason = "Never placed an order since signup"

        prob = round(min(99.0, max(1.0, prob)), 1)

        scored_customers.append({
            "customer_id": r["customer_id"],
            "name": r["name"],
            "city": r["city"],
            "frequency": r["frequency"] or 0,
            "total_spent": r["total_spent"] or 0.0,
            "last_order_date": r["last_order_date"] or "N/A",
            "recency_days": recency_days,
            "churn_probability": prob,
            "risk_badge": badge,
            "reason": reason
        })

    # Sort by probability descending (highest risk first)
    scored_customers.sort(key=lambda x: x["churn_probability"], reverse=True)

    high_count = sum(1 for c in scored_customers if c["risk_badge"] == "high")
    med_count = sum(1 for c in scored_customers if c["risk_badge"] == "medium")
    low_count = sum(1 for c in scored_customers if c["risk_badge"] == "low")
    avg_churn = round(np.mean([c["churn_probability"] for c in scored_customers]), 1) if scored_customers else 0.0

    return {
        "customers": scored_customers,
        "summary": {
            "total_customers": len(scored_customers),
            "high_risk_count": high_count,
            "medium_risk_count": med_count,
            "low_risk_count": low_count,
            "average_churn_probability": avg_churn,
            "at_risk_ratio_pct": round(high_count / len(scored_customers) * 100, 1) if scored_customers else 0.0
        }
    }
