"""
Database connections for MongoDB (async) and SQLite.
"""
import os
import aiosqlite
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# ── MongoDB ──────────────────────────────────────────────────────────────────
mongodb_client: AsyncIOMotorClient | None = None
mongodb = None


async def connect_mongodb():
    """Initialize MongoDB connection."""
    global mongodb_client, mongodb
    mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
    mongodb = mongodb_client[settings.DATABASE_NAME]
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
    return mongodb


async def disconnect_mongodb():
    """Close MongoDB connection."""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("❌ Disconnected from MongoDB")


def get_db():
    """Return the current MongoDB database instance."""
    return mongodb


# ── SQLite ────────────────────────────────────────────────────────────────────
async def get_sqlite_connection(tenant_id: str | None = None):
    """Open and return an aiosqlite connection.

    Multi-tenant Phase 2 skeleton:
    - If tenant_id is provided, uses {SQLITE_DB_PATH_PREFIX}{tenant_id}.db
    - Otherwise uses legacy settings.SQLITE_DB_PATH.
    """
    if tenant_id:
        db_path = f"{settings.SQLITE_DB_PATH_PREFIX}{tenant_id}.db"
    else:
        db_path = settings.SQLITE_DB_PATH

    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row
    return conn



async def init_sqlite(tenant_id: str | None = None):
    """Create SQLite tables and seed with sample data if empty.

    Multi-tenant Phase 2 skeleton:
    - If tenant_id is provided, initializes tables for that tenant DB file.
    - Otherwise initializes legacy global DB.
    """
    db_path = f"{settings.SQLITE_DB_PATH_PREFIX}{tenant_id}.db" if tenant_id else settings.SQLITE_DB_PATH

    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async with aiosqlite.connect(db_path) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS customers (
                customer_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                city TEXT,
                signup_date TEXT
            );

            CREATE TABLE IF NOT EXISTS products (
                product_id TEXT PRIMARY KEY,
                product_name TEXT NOT NULL,
                category TEXT,
                price REAL
            );

            CREATE TABLE IF NOT EXISTS orders (
                order_id TEXT PRIMARY KEY,
                customer_id TEXT REFERENCES customers(customer_id),
                order_date TEXT,
                amount REAL
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT REFERENCES orders(order_id),
                product_id TEXT REFERENCES products(product_id),
                quantity INTEGER
            );
        """)
        await db.commit()
    print("✅ SQLite tables initialized")
