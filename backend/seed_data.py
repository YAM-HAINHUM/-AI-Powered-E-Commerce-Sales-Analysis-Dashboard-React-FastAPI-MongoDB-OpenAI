"""
Seed script — populates SQLite + MongoDB with realistic sample e-commerce data.
Run: python seed_data.py
"""
import asyncio
import random
import os
import sys
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

import aiosqlite
from app.config import settings
from app.database import connect_mongodb, init_sqlite

# ── Sample data ───────────────────────────────────────────────────────────────
CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
          "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"]

FIRST_NAMES = ["Alice", "Bob", "Carol", "David", "Emma", "Frank", "Grace",
               "Henry", "Isabella", "James", "Karen", "Liam", "Mia", "Noah",
               "Olivia", "Paul", "Quinn", "Rachel", "Sam", "Tina"]

LAST_NAMES = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
              "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
              "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson"]

PRODUCTS = [
    ("P001", "Wireless Earbuds Pro", "Electronics", 89.99),
    ("P002", "Smartphone Stand", "Electronics", 24.99),
    ("P003", "Running Shoes", "Clothing", 79.99),
    ("P004", "Python Programming Book", "Books", 44.99),
    ("P005", "Coffee Maker Deluxe", "Home & Kitchen", 129.99),
    ("P006", "Yoga Mat Premium", "Sports", 49.99),
    ("P007", "Laptop Backpack", "Electronics", 59.99),
    ("P008", "Casual T-Shirt Pack", "Clothing", 34.99),
    ("P009", "Data Science Handbook", "Books", 54.99),
    ("P010", "Blender Pro 3000", "Home & Kitchen", 89.99),
    ("P011", "Gaming Mouse RGB", "Electronics", 69.99),
    ("P012", "Denim Jacket Classic", "Clothing", 89.99),
    ("P013", "React.js Complete Guide", "Books", 39.99),
    ("P014", "Air Fryer XL", "Home & Kitchen", 109.99),
    ("P015", "Resistance Bands Set", "Sports", 29.99),
    ("P016", "Mechanical Keyboard", "Electronics", 139.99),
    ("P017", "Winter Coat Premium", "Clothing", 149.99),
    ("P018", "Machine Learning Basics", "Books", 49.99),
    ("P019", "Instant Pot 6QT", "Home & Kitchen", 99.99),
    ("P020", "Dumbbells Set 20kg", "Sports", 79.99),
]


async def seed():
    os.makedirs(os.path.dirname(settings.SQLITE_DB_PATH), exist_ok=True)
    await init_sqlite()
    db = await connect_mongodb()

    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as conn:
        # Clear existing
        await conn.execute("DELETE FROM order_items")
        await conn.execute("DELETE FROM orders")
        await conn.execute("DELETE FROM products")
        await conn.execute("DELETE FROM customers")
        await conn.commit()

        # Products
        await conn.executemany(
            "INSERT INTO products VALUES (?, ?, ?, ?)", PRODUCTS
        )

        # Customers
        customers = []
        for i in range(1, 51):
            cid = f"C{i:03d}"
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            city = random.choice(CITIES)
            signup = (datetime.now() - timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d")
            customers.append((cid, name, city, signup))

        await conn.executemany("INSERT INTO customers VALUES (?, ?, ?, ?)", customers)

        # Orders + Order Items
        order_rows = []
        item_rows = []
        order_id = 1
        base_date = datetime.now() - timedelta(days=365)

        for cid, *_ in customers:
            num_orders = random.randint(1, 8)
            for _ in range(num_orders):
                oid = f"ORD{order_id:04d}"
                odate = (base_date + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
                # Pick 1-3 products
                chosen = random.sample(PRODUCTS, random.randint(1, 3))
                amount = sum(p[3] * random.randint(1, 3) for p in chosen)
                order_rows.append((oid, cid, odate, round(amount, 2)))
                for p in chosen:
                    item_rows.append((oid, p[0], random.randint(1, 3)))
                order_id += 1

        await conn.executemany("INSERT INTO orders VALUES (?, ?, ?, ?)", order_rows)
        await conn.executemany("INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)", item_rows)
        await conn.commit()

    print(f"✅ SQLite seeded: {len(customers)} customers, {len(order_rows)} orders")

    # MongoDB collections
    await db.customers.delete_many({})
    await db.orders.delete_many({})
    await db.products.delete_many({})
    await db.ai_insights.delete_many({})
    await db.query_logs.delete_many({})

    mongo_customers = [
        {"customer_id": c[0], "name": c[1], "city": c[2], "signup_date": c[3]}
        for c in customers
    ]
    await db.customers.insert_many(mongo_customers)

    mongo_products = [
        {"product_id": p[0], "product_name": p[1], "category": p[2], "price": p[3]}
        for p in PRODUCTS
    ]
    await db.products.insert_many(mongo_products)

    # Sample AI insights
    insights = [
        {
            "type": "general",
            "content": "Revenue is trending up 18.3% month-over-month. Electronics leads all categories.",
            "generated_at": datetime.utcnow(),
        },
        {
            "type": "recommendation",
            "content": "15 customers haven't purchased in 60+ days — launch a win-back campaign.",
            "generated_at": datetime.utcnow(),
        },
    ]
    await db.ai_insights.insert_many(insights)

    print(f"✅ MongoDB seeded: customers, products, insights")
    print("🎉 Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
