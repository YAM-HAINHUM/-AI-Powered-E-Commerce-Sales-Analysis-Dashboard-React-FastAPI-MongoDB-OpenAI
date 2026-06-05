"""
Advanced Analytics Service — CLV, cohort analysis, retention, city-wise geo data,
profit analysis, and query history management.
"""
from __future__ import annotations
import aiosqlite
from datetime import datetime
from app.config import settings


async def get_clv_analysis() -> dict:
    """Customer Lifetime Value analysis."""
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT
                c.customer_id,
                c.name,
                c.city,
                c.signup_date,
                COUNT(o.order_id)          AS order_count,
                ROUND(SUM(o.amount), 2)    AS total_spent,
                ROUND(AVG(o.amount), 2)    AS avg_order_value,
                MIN(o.order_date)          AS first_order,
                MAX(o.order_date)          AS last_order
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            GROUP BY c.customer_id
            ORDER BY total_spent DESC
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    today = datetime.now()
    clv_data = []
    for r in rows:
        if r["signup_date"]:
            tenure_days = (today - datetime.strptime(r["signup_date"], "%Y-%m-%d")).days
            tenure_months = max(1, tenure_days / 30)
        else:
            tenure_months = 1

        # Simple CLV = avg_order_value * purchase_frequency * avg_customer_lifespan
        monthly_freq = (r["order_count"] or 0) / tenure_months
        # Assume 24-month lifespan
        clv = round((r["avg_order_value"] or 0) * monthly_freq * 24, 2)

        clv_data.append({
            **r,
            "tenure_months": round(tenure_months, 1),
            "monthly_frequency": round(monthly_freq, 3),
            "clv_estimate": clv,
            "clv_tier": "Platinum" if clv > 2000 else "Gold" if clv > 800 else "Silver" if clv > 200 else "Bronze",
        })

    return {
        "customers": clv_data,
        "summary": {
            "avg_clv": round(sum(c["clv_estimate"] for c in clv_data) / len(clv_data), 2) if clv_data else 0,
            "platinum_count": sum(1 for c in clv_data if c["clv_tier"] == "Platinum"),
            "gold_count": sum(1 for c in clv_data if c["clv_tier"] == "Gold"),
            "silver_count": sum(1 for c in clv_data if c["clv_tier"] == "Silver"),
            "bronze_count": sum(1 for c in clv_data if c["clv_tier"] == "Bronze"),
        },
    }


async def get_city_revenue() -> dict:
    """City-wise revenue for geo analytics."""
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT
                c.city,
                COUNT(DISTINCT c.customer_id) AS customers,
                COUNT(o.order_id)             AS orders,
                ROUND(SUM(o.amount), 2)       AS revenue,
                ROUND(AVG(o.amount), 2)       AS avg_order
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            GROUP BY c.city
            ORDER BY revenue DESC
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    total_rev = sum(r["revenue"] or 0 for r in rows)
    for r in rows:
        r["pct_of_total"] = round((r["revenue"] or 0) / total_rev * 100, 1) if total_rev else 0

    return {"cities": rows, "total_cities": len(rows)}


async def get_cohort_analysis() -> dict:
    """Monthly cohort retention analysis."""
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # First order month per customer
        async with db.execute("""
            SELECT customer_id, MIN(strftime('%Y-%m', order_date)) AS cohort_month
            FROM orders GROUP BY customer_id
        """) as cur:
            cohorts = {r["customer_id"]: r["cohort_month"] for r in await cur.fetchall()}

        # All orders
        async with db.execute("""
            SELECT customer_id, strftime('%Y-%m', order_date) AS order_month
            FROM orders
        """) as cur:
            all_orders = [dict(r) for r in await cur.fetchall()]

    from collections import defaultdict
    cohort_data: dict = defaultdict(lambda: defaultdict(set))
    for order in all_orders:
        cid = order["customer_id"]
        cohort = cohorts.get(cid)
        if cohort:
            cohort_data[cohort][order["order_month"]].add(cid)

    cohort_months = sorted(cohort_data.keys())
    result = []
    for cohort in cohort_months[-6:]:  # last 6 cohorts
        base_count = len(cohort_data[cohort][cohort])
        if base_count == 0:
            continue
        row = {"cohort": cohort, "size": base_count, "retention": {}}
        all_months = sorted(cohort_data[cohort].keys())
        for i, m in enumerate(all_months[:6]):
            retained = len(cohort_data[cohort][m])
            row["retention"][f"month_{i}"] = round(retained / base_count * 100, 1)
        result.append(row)

    return {"cohorts": result}


async def get_retention_analysis() -> dict:
    """Monthly repeat purchase rate."""
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT
                strftime('%Y-%m', order_date) AS month,
                COUNT(DISTINCT customer_id)   AS active_customers,
                COUNT(order_id)               AS orders
            FROM orders
            GROUP BY month
            ORDER BY month ASC
        """) as cur:
            monthly = [dict(r) for r in await cur.fetchall()]

        async with db.execute("""
            SELECT customer_id, COUNT(*) AS cnt FROM orders GROUP BY customer_id
        """) as cur:
            freq = [dict(r) for r in await cur.fetchall()]

    repeat_customers = sum(1 for r in freq if r["cnt"] > 1)
    total_customers = len(freq)
    repeat_rate = round(repeat_customers / total_customers * 100, 1) if total_customers else 0

    return {
        "monthly_active": monthly,
        "repeat_rate": repeat_rate,
        "repeat_customers": repeat_customers,
        "one_time_customers": total_customers - repeat_customers,
        "total_customers": total_customers,
    }
