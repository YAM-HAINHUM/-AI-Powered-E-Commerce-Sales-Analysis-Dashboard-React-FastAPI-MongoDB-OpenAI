"""
Pricing AI Service — analyzes product price points and units sold to suggest
optimal prices (markdowns/markups) and calculate monthly revenue impacts.
"""
from __future__ import annotations
import aiosqlite
from app.config import settings

async def analyze_pricing() -> dict:
    """
    Analyzes products and order items to recommend dynamic price changes.
    """
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT 
                p.product_id, 
                p.product_name, 
                p.category, 
                p.price,
                COALESCE(SUM(oi.quantity), 0) AS units_sold
            FROM products p
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.product_id
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    if not rows:
        return {"recommendations": [], "summary": {}}

    recommendations = []
    total_expected_gain = 0.0

    for r in rows:
        price = r["price"]
        units = r["units_sold"]
        
        # Pricing optimization rules
        if units == 0:
            change_pct = -15.0
            elasticity = "High"
            expected_gain = round(price * 5 * 0.15, 2)  # assume 5 units sold at 15% lower price
            reason = "No units sold. Suggest 15% markdown to clear initial inventory barriers."
            suggestion = "Reduce price by 15% to stimulate sales velocity"
        elif units < 8:
            change_pct = -8.0
            elasticity = "High"
            expected_gain = round(price * 10 * 0.08, 2)
            reason = "Low sales speed. Suggest 8% price markdown to improve conversions."
            suggestion = "Markdown price by 8% to capture low-intent buyers"
        elif units > 30:
            change_pct = 5.0
            elasticity = "Low"
            expected_gain = round(price * units * 0.05, 2)
            reason = "High-velocity product in strong demand. Suggest 5% markup to expand profit margins."
            suggestion = "Increase price by 5% to capture additional margin"
        else:
            change_pct = 0.0
            elasticity = "Medium"
            expected_gain = round(price * 0.02 * units, 2) # bundle yield
            reason = "Consistent purchasing velocity. Maintain price but bundle with accessories for +5% checkout value."
            suggestion = "Keep current price, implement bundle discounts"

        suggested_price = round(price * (1 + change_pct / 100.0), 2)
        total_expected_gain += expected_gain

        recommendations.append({
            "product_id": r["product_id"],
            "product_name": r["product_name"],
            "category": r["category"],
            "price": price,
            "units_sold": units,
            "suggested_price": suggested_price,
            "change_pct": change_pct,
            "elasticity": elasticity,
            "expected_gain": expected_gain,
            "reason": reason,
            "suggestion": suggestion
        })

    # Sort recommendations by expected gain descending (highest impact first)
    recommendations.sort(key=lambda x: x["expected_gain"], reverse=True)

    markdown_count = sum(1 for r in recommendations if r["change_pct"] < 0)
    markup_count = sum(1 for r in recommendations if r["change_pct"] > 0)
    flat_count = sum(1 for r in recommendations if r["change_pct"] == 0)

    return {
        "recommendations": recommendations,
        "summary": {
            "total_products_analyzed": len(recommendations),
            "expected_monthly_revenue_gain": round(total_expected_gain, 2),
            "markdown_suggestions": markdown_count,
            "markup_suggestions": markup_count,
            "no_change_suggestions": flat_count,
        }
    }
