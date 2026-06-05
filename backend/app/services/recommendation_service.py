"""
Recommendation Engine — co-purchase association rules.
"Customers who bought X also bought Y" using item co-occurrence matrix.
"""
from __future__ import annotations
import aiosqlite
from collections import defaultdict
from app.config import settings


async def get_product_recommendations(product_id: str | None = None, top_n: int = 5) -> dict:
    """
    Build co-purchase matrix from order_items.
    If product_id given, return top_n recommendations for that product.
    Otherwise return top pairs overall.
    """
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Fetch all order items grouped by order
        async with db.execute("""
            SELECT oi.order_id, oi.product_id, p.product_name, p.category, p.price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            ORDER BY oi.order_id
        """) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

        # Fetch all products for lookup
        async with db.execute("SELECT product_id, product_name, category, price FROM products") as cur:
            all_products = {r["product_id"]: dict(r) for r in await cur.fetchall()}

    # Group products by order
    order_baskets: dict[str, set] = defaultdict(set)
    for row in rows:
        order_baskets[row["order_id"]].add(row["product_id"])

    # Build co-occurrence counts
    co_occur: dict[tuple, int] = defaultdict(int)
    product_freq: dict[str, int] = defaultdict(int)

    for basket in order_baskets.values():
        basket_list = sorted(basket)
        for pid in basket_list:
            product_freq[pid] += 1
        for i in range(len(basket_list)):
            for j in range(i + 1, len(basket_list)):
                pair = (basket_list[i], basket_list[j])
                co_occur[pair] += 1

    total_orders = len(order_baskets)

    # Compute confidence scores: P(B|A) = co_occur(A,B) / freq(A)
    recommendations: dict[str, list] = defaultdict(list)
    for (p1, p2), count in co_occur.items():
        if count < 1:
            continue
        conf_p1 = count / product_freq[p1] if product_freq[p1] else 0
        conf_p2 = count / product_freq[p2] if product_freq[p2] else 0
        lift = (count / total_orders) / ((product_freq[p1] / total_orders) * (product_freq[p2] / total_orders)) if total_orders else 1

        recommendations[p1].append({
            "product_id": p2,
            "product_name": all_products.get(p2, {}).get("product_name", p2),
            "category": all_products.get(p2, {}).get("category", ""),
            "price": all_products.get(p2, {}).get("price", 0),
            "co_purchases": count,
            "confidence": round(conf_p1, 3),
            "lift": round(lift, 2),
        })
        recommendations[p2].append({
            "product_id": p1,
            "product_name": all_products.get(p1, {}).get("product_name", p1),
            "category": all_products.get(p1, {}).get("category", ""),
            "price": all_products.get(p1, {}).get("price", 0),
            "co_purchases": count,
            "confidence": round(conf_p2, 3),
            "lift": round(lift, 2),
        })

    # Sort each product's recommendations by confidence desc
    for pid in recommendations:
        recommendations[pid].sort(key=lambda x: x["confidence"], reverse=True)

    if product_id:
        recs = recommendations.get(product_id, [])[:top_n]
        source = all_products.get(product_id, {})
        return {
            "product_id": product_id,
            "product_name": source.get("product_name", product_id),
            "recommendations": recs,
        }

    # Top pairs overall
    top_pairs = sorted(co_occur.items(), key=lambda x: x[1], reverse=True)[:20]
    top_pairs_out = []
    for (p1, p2), count in top_pairs:
        top_pairs_out.append({
            "product_a": all_products.get(p1, {}).get("product_name", p1),
            "product_b": all_products.get(p2, {}).get("product_name", p2),
            "co_purchases": count,
            "lift": round(
                (count / total_orders) / ((product_freq[p1] / total_orders) * (product_freq[p2] / total_orders))
                if total_orders else 1, 2
            ),
        })

    # Per-product top recommendation
    per_product = []
    for pid, prod in all_products.items():
        recs = recommendations.get(pid, [])
        if recs:
            per_product.append({
                "product_id": pid,
                "product_name": prod["product_name"],
                "category": prod["category"],
                "top_recommendation": recs[0],
            })

    return {
        "top_pairs": top_pairs_out,
        "per_product": per_product,
        "all_products": [
            {"product_id": pid, "product_name": p["product_name"], "category": p["category"]}
            for pid, p in all_products.items()
        ],
    }
