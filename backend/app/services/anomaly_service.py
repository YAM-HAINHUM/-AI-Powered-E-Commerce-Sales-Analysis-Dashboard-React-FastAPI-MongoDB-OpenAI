"""
Anomaly Detection Service — uses Z-score to flag unusual revenue spikes/drops.
Alerts are generated when a day's revenue deviates > 2 std deviations from the mean.
"""
from __future__ import annotations
import aiosqlite
import numpy as np
from app.config import settings


async def detect_anomalies() -> dict:
    """
    Detect revenue anomalies in daily data using Z-score method.
    Returns flagged days with severity and alert messages.
    """
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT order_date AS date,
                   ROUND(SUM(amount), 2) AS revenue,
                   COUNT(*) AS orders
            FROM orders
            GROUP BY order_date
            ORDER BY order_date ASC
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    if len(rows) < 7:
        return {"anomalies": [], "summary": {"total_anomalies": 0, "status": "insufficient_data"}}

    revenues = np.array([r["revenue"] for r in rows], dtype=float)
    mean = float(np.mean(revenues))
    std = float(np.std(revenues))

    anomalies = []
    for i, row in enumerate(rows):
        if std == 0:
            continue
        z = (row["revenue"] - mean) / std
        if abs(z) >= 1.8:  # threshold: 1.8 std deviations
            direction = "spike" if z > 0 else "drop"
            pct_change = round(((row["revenue"] - mean) / mean) * 100, 1)

            # Compare to previous day if available
            prev_day_rev = rows[i - 1]["revenue"] if i > 0 else mean
            day_over_day = round(((row["revenue"] - prev_day_rev) / prev_day_rev) * 100, 1) if prev_day_rev else 0

            severity = "critical" if abs(z) >= 3 else "high" if abs(z) >= 2.5 else "medium"

            alert_msg = (
                f"⚠️ Revenue {direction} detected on {row['date']}: "
                f"${row['revenue']:,.0f} ({'+' if pct_change > 0 else ''}{pct_change}% vs avg)"
            )
            if abs(day_over_day) >= 30:
                alert_msg += f" | {abs(day_over_day):.0f}% {'increase' if day_over_day > 0 else 'drop'} vs previous day"

            anomalies.append({
                "date": row["date"],
                "revenue": row["revenue"],
                "orders": row["orders"],
                "z_score": round(z, 2),
                "direction": direction,
                "severity": severity,
                "pct_from_mean": pct_change,
                "day_over_day_pct": day_over_day,
                "alert": alert_msg,
            })

    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2}
    anomalies.sort(key=lambda x: severity_order.get(x["severity"], 3))

    # Recent 30-day trend for context
    recent = rows[-30:]
    recent_mean = float(np.mean([r["revenue"] for r in recent]))
    overall_mean = mean

    return {
        "anomalies": anomalies[:20],  # top 20
        "all_daily": [{"date": r["date"], "revenue": r["revenue"], "orders": r["orders"]} for r in rows],
        "summary": {
            "total_anomalies": len(anomalies),
            "critical_count": sum(1 for a in anomalies if a["severity"] == "critical"),
            "high_count": sum(1 for a in anomalies if a["severity"] == "high"),
            "mean_daily_revenue": round(mean, 2),
            "std_daily_revenue": round(std, 2),
            "recent_30d_mean": round(recent_mean, 2),
            "trend": "improving" if recent_mean > overall_mean else "declining",
        },
    }
