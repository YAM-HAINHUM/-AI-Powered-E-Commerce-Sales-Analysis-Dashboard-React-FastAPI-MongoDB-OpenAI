"""
SQL Analysis Engine - executes predefined and custom SQL queries against SQLite.
"""
import time
import aiosqlite
from app.database import get_sqlite_connection
from app.config import settings


PREDEFINED_QUERIES: dict[str, str] = {
    "total_revenue": """
        SELECT
            SUM(o.amount) AS total_revenue,
            COUNT(o.order_id) AS total_orders,
            ROUND(AVG(o.amount), 2) AS avg_order_value
        FROM orders o
    """,

    "top_customers": """
        SELECT
            c.customer_id,
            c.name,
            c.city,
            COUNT(o.order_id) AS total_orders,
            ROUND(SUM(o.amount), 2) AS total_spent
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.name, c.city
        ORDER BY total_spent DESC
        LIMIT 10
    """,

    "monthly_sales_trend": """
        SELECT
            strftime('%Y-%m', order_date) AS month,
            COUNT(order_id) AS orders,
            ROUND(SUM(amount), 2) AS revenue
        FROM orders
        GROUP BY strftime('%Y-%m', order_date)
        ORDER BY month ASC
    """,

    "best_selling_products": """
        SELECT
            p.product_name,
            p.category,
            SUM(oi.quantity) AS units_sold,
            ROUND(SUM(oi.quantity * p.price), 2) AS revenue
        FROM products p
        JOIN order_items oi ON p.product_id = oi.product_id
        GROUP BY p.product_id, p.product_name, p.category
        ORDER BY units_sold DESC
        LIMIT 10
    """,

    "customer_ranking": """
        SELECT
            c.name,
            c.city,
            ROUND(SUM(o.amount), 2) AS total_spent,
            RANK() OVER (ORDER BY SUM(o.amount) DESC) AS spending_rank
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.name, c.city
        ORDER BY spending_rank
    """,

    "repeat_customers": """
        WITH customer_orders AS (
            SELECT
                customer_id,
                COUNT(order_id) AS order_count
            FROM orders
            GROUP BY customer_id
        )
        SELECT
            c.name,
            c.city,
            co.order_count
        FROM customers c
        JOIN customer_orders co ON c.customer_id = co.customer_id
        WHERE co.order_count > 1
        ORDER BY co.order_count DESC
    """,

    "running_total": """
        SELECT
            order_date,
            amount,
            ROUND(SUM(amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING), 2)
                AS running_total
        FROM orders
        ORDER BY order_date ASC
        LIMIT 50
    """,

    "category_revenue": """
        SELECT
            p.category,
            COUNT(DISTINCT oi.order_id) AS orders,
            SUM(oi.quantity) AS units_sold,
            ROUND(SUM(oi.quantity * p.price), 2) AS revenue
        FROM products p
        JOIN order_items oi ON p.product_id = oi.product_id
        GROUP BY p.category
        ORDER BY revenue DESC
    """,
}


async def run_predefined_query(query_name: str) -> dict:
    """Execute a named predefined SQL query."""
    if query_name not in PREDEFINED_QUERIES:
        raise ValueError(f"Unknown query: {query_name}")
    return await run_custom_query(PREDEFINED_QUERIES[query_name])


async def run_custom_query(sql: str) -> dict:
    """Execute arbitrary (read-only) SQL and return column + row data."""
    start = time.monotonic()

    # Allow only SELECT statements for safety
    normalized = sql.strip().upper()
    if not normalized.startswith("SELECT") and not normalized.startswith("WITH"):
        raise ValueError("Only SELECT / WITH queries are allowed.")

    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        try:
            async with db.execute(sql) as cursor:
                rows = await cursor.fetchall()
                columns = [desc[0] for desc in cursor.description or []]
        except Exception as e:
            raise ValueError(f"SQL error: {str(e)}")

    elapsed_ms = (time.monotonic() - start) * 1000

    return {
        "columns": columns,
        "rows": [list(row) for row in rows],
        "row_count": len(rows),
        "execution_time_ms": round(elapsed_ms, 2),
        "query_used": sql.strip(),
    }
