"""
Customer routes — list, search, and individual customer detail.
"""
from fastapi import APIRouter, Depends, Query
import aiosqlite
from app.config import settings
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("")
async def list_customers(
    page: int = 1,
    limit: int = 20,
    search: str = Query(default=""),
    _: dict = Depends(get_current_user),
):
    offset = (page - 1) * limit
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        where = "WHERE c.name LIKE ?" if search else ""
        params = [f"%{search}%"] if search else []

        async with db.execute(f"""
            SELECT c.customer_id, c.name, c.city, c.signup_date,
                   COUNT(o.order_id) AS total_orders,
                   ROUND(COALESCE(SUM(o.amount), 0), 2) AS total_spent
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            {where}
            GROUP BY c.customer_id
            ORDER BY total_spent DESC
            LIMIT ? OFFSET ?
        """, [*params, limit, offset]) as cursor:
            rows = [dict(r) for r in await cursor.fetchall()]

        async with db.execute(f"SELECT COUNT(*) AS cnt FROM customers c {where}", params) as cursor:
            total = (await cursor.fetchone())[0]

    return {"customers": rows, "total": total, "page": page, "limit": limit}


@router.get("/{customer_id}")
async def get_customer(customer_id: str, _: dict = Depends(get_current_user)):
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM customers WHERE customer_id = ?", [customer_id]
        ) as cursor:
            row = await cursor.fetchone()
        if not row:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Customer not found")

        async with db.execute(
            "SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC LIMIT 20",
            [customer_id],
        ) as cursor:
            orders = [dict(r) for r in await cursor.fetchall()]

    return {"customer": dict(row), "orders": orders}
