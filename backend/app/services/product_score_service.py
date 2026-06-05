"""
Product Performance Score Service — calculates score (0-100) and grade (A-D)
based on sales frequency, revenue, and mock return/rating indices.
"""
from __future__ import annotations
import aiosqlite
import hashlib
from app.config import settings

def _deterministic_mock_stats(pid: str) -> tuple[float, float]:
    """Generates rating and return rate deterministically based on product ID hash."""
    h = int(hashlib.md5(pid.encode()).hexdigest(), 16)
    # Rating between 3.6 and 5.0
    rating = round(3.6 + (h % 15) * 0.1, 1)
    # Return rate between 0.5% and 9.5%
    return_rate = round(0.5 + (h % 10) * 1.0, 1)
    return rating, return_rate

async def compute_product_scores() -> dict:
    """
    Computes performance score and letter grade for all products.
    """
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT 
                p.product_id, 
                p.product_name, 
                p.category, 
                p.price,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                ROUND(COALESCE(SUM(oi.quantity * p.price), 0), 2) AS revenue
            FROM products p
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.product_id
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    if not rows:
        return {"products": [], "summary": {}}

    # Find max values for normalization
    max_units = max(r["units_sold"] for r in rows) if rows else 1
    max_revenue = max(r["revenue"] for r in rows) if rows else 1

    scored_products = []
    for r in rows:
        rating, return_rate = _deterministic_mock_stats(r["product_id"])
        
        # Calculate raw components
        units_norm = (r["units_sold"] / max_units) if max_units > 0 else 0
        rev_norm = (r["revenue"] / max_revenue) if max_revenue > 0 else 0
        
        # Scoring scale (0 - 100):
        # - Sales velocity: 40%
        # - Revenue: 30%
        # - Customer ratings: 20%
        # - Penalty for returns: -10% (10% max deduction)
        velocity_score = units_norm * 40
        revenue_score = rev_norm * 30
        rating_score = ((rating - 3.5) / 1.5) * 20 if rating >= 3.5 else 0
        returns_penalty = (return_rate / 10.0) * 10
        
        raw_score = velocity_score + revenue_score + rating_score - returns_penalty
        
        # Standardize score to fit between 45 and 98 for presentation
        score = round(45.0 + (raw_score / 90.0) * 53.0)
        score = min(99, max(35, score))

        # Assign Grade
        if score >= 85:
            grade = "A"
            status = "Excellent Performance"
        elif score >= 70:
            grade = "B"
            status = "Good Performance"
        elif score >= 50:
            grade = "C"
            status = "Moderate Performance"
        else:
            grade = "D"
            status = "Underperforming"

        scored_products.append({
            "product_id": r["product_id"],
            "product_name": r["product_name"],
            "category": r["category"],
            "price": r["price"],
            "units_sold": r["units_sold"],
            "revenue": r["revenue"],
            "rating": rating,
            "return_rate_pct": return_rate,
            "performance_score": score,
            "grade": grade,
            "status": status
        })

    # Sort by performance score descending
    scored_products.sort(key=lambda x: x["performance_score"], reverse=True)

    grade_counts = {"A": 0, "B": 0, "C": 0, "D": 0}
    for p in scored_products:
        grade_counts[p["grade"]] += 1

    return {
        "products": scored_products,
        "summary": {
            "total_products": len(scored_products),
            "average_score": round(sum(p["performance_score"] for p in scored_products) / len(scored_products), 1) if scored_products else 0.0,
            "grade_distribution": grade_counts,
            "top_product": scored_products[0]["product_name"] if scored_products else "N/A",
            "lowest_product": scored_products[-1]["product_name"] if scored_products else "N/A",
        }
    }
