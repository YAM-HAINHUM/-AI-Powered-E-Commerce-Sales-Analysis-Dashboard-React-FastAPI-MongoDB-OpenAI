"""
Customer Segmentation Service — K-Means clustering on RFM (Recency, Frequency, Monetary) features.
Segments customers into: High-Value, At-Risk, New, Regular.
"""
from __future__ import annotations
import aiosqlite
import numpy as np
from datetime import datetime
from app.config import settings


def _normalize(arr: np.ndarray) -> np.ndarray:
    """Min-max normalize an array to [0, 1]."""
    mn, mx = arr.min(), arr.max()
    if mx == mn:
        return np.zeros_like(arr, dtype=float)
    return (arr - mn) / (mx - mn)


def _kmeans_manual(X: np.ndarray, k: int = 4, max_iter: int = 100) -> np.ndarray:
    """Simple K-Means without sklearn dependency for portability."""
    np.random.seed(42)
    # Initialize centroids from random data points
    idx = np.random.choice(len(X), k, replace=False)
    centroids = X[idx].copy()

    labels = np.zeros(len(X), dtype=int)
    for _ in range(max_iter):
        # Assign clusters
        dists = np.array([[np.linalg.norm(x - c) for c in centroids] for x in X])
        new_labels = np.argmin(dists, axis=1)
        if np.array_equal(new_labels, labels):
            break
        labels = new_labels
        # Update centroids
        for j in range(k):
            members = X[labels == j]
            if len(members) > 0:
                centroids[j] = members.mean(axis=0)
    return labels


async def get_customer_segments() -> dict:
    """
    Compute RFM scores and cluster customers into 4 segments.
    Returns per-customer segment + aggregate stats per segment.
    """
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT
                c.customer_id,
                c.name,
                c.city,
                COUNT(o.order_id)          AS frequency,
                ROUND(SUM(o.amount), 2)    AS monetary,
                MAX(o.order_date)          AS last_order_date
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            GROUP BY c.customer_id
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    if not rows:
        return {"segments": [], "summary": {}}

    today = datetime.now()

    # Build RFM matrix
    rfm = []
    for r in rows:
        if r["last_order_date"]:
            last_dt = datetime.strptime(r["last_order_date"], "%Y-%m-%d")
            recency = (today - last_dt).days
        else:
            recency = 999
        rfm.append({
            "customer_id": r["customer_id"],
            "name": r["name"],
            "city": r["city"],
            "recency": recency,
            "frequency": r["frequency"] or 0,
            "monetary": r["monetary"] or 0.0,
        })

    recency_arr = np.array([x["recency"] for x in rfm], dtype=float)
    freq_arr = np.array([x["frequency"] for x in rfm], dtype=float)
    monetary_arr = np.array([x["monetary"] for x in rfm], dtype=float)

    # Normalize (invert recency so lower = better)
    r_norm = 1 - _normalize(recency_arr)
    f_norm = _normalize(freq_arr)
    m_norm = _normalize(monetary_arr)

    X = np.column_stack([r_norm, f_norm, m_norm])

    k = min(4, len(rfm))
    labels = _kmeans_manual(X, k=k)

    # Score each cluster to assign meaningful names
    cluster_scores = {}
    for j in range(k):
        members = X[labels == j]
        cluster_scores[j] = float(members.mean())

    sorted_clusters = sorted(cluster_scores.items(), key=lambda x: x[1], reverse=True)
    segment_names = ["High-Value", "Regular", "At-Risk", "New/Inactive"]
    cluster_to_name = {c: segment_names[i] for i, (c, _) in enumerate(sorted_clusters)}

    segment_colors = {
        "High-Value": "#34d399",
        "Regular": "#818cf8",
        "At-Risk": "#f87171",
        "New/Inactive": "#fbbf24",
    }

    # Attach segment to each customer
    customers_out = []
    for i, row in enumerate(rfm):
        seg = cluster_to_name[int(labels[i])]
        customers_out.append({
            **row,
            "segment": seg,
            "color": segment_colors[seg],
            "rfm_score": round(float(X[i].mean()), 3),
        })

    # Aggregate per segment
    from collections import defaultdict
    seg_agg: dict = defaultdict(lambda: {"count": 0, "total_revenue": 0.0, "avg_recency": 0.0, "customers": []})
    for c in customers_out:
        s = c["segment"]
        seg_agg[s]["count"] += 1
        seg_agg[s]["total_revenue"] += c["monetary"]
        seg_agg[s]["avg_recency"] += c["recency"]
        seg_agg[s]["customers"].append(c["name"])

    summary = []
    for seg, data in seg_agg.items():
        summary.append({
            "segment": seg,
            "color": segment_colors[seg],
            "count": data["count"],
            "total_revenue": round(data["total_revenue"], 2),
            "avg_recency_days": round(data["avg_recency"] / data["count"], 1),
            "pct_of_customers": round(data["count"] / len(customers_out) * 100, 1),
        })

    return {
        "customers": customers_out,
        "segment_summary": summary,
        "total_customers": len(customers_out),
        "features_used": ["Recency (days since last order)", "Frequency (order count)", "Monetary (total spend)"],
    }
