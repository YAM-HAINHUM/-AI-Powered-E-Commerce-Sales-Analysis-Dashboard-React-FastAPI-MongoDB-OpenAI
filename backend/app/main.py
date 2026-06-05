from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import random
from datetime import datetime

from app.config import settings
from app.database import connect_mongodb, disconnect_mongodb, init_sqlite
from app.routes import auth, dashboard, analytics, customers, sql_query, ai_insights, ai_insights_panel, advanced, report, upload, user_tracking
from app.middleware.tracking_middleware import UserActivityMiddleware

from app.services.websocket_manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    await connect_mongodb()
    # Initialize legacy global DB for backward compatibility.
    await init_sqlite()
    # Initialize tracking indexes
    from app.services.indexes import init_all_indexes
    await init_all_indexes(app)

    print(f"🚀 {settings.APP_NAME} API is running!")
    yield
    # Shutdown
    await disconnect_mongodb()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered e-commerce sales analysis REST API",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
print("🛡️ CORS allowed origins:", settings.cors_origins_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)



# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(customers.router)
app.include_router(sql_query.router)
app.include_router(ai_insights.router)
app.include_router(ai_insights_panel.router)

app.include_router(advanced.router)

# Premium AI SaaS pages
from app.routes.saas import router as saas_router
app.include_router(saas_router)



app.include_router(report.router)
app.include_router(upload.router)
app.include_router(user_tracking.router)

# Add user activity tracking middleware
app.add_middleware(UserActivityMiddleware)



@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "version": settings.VERSION}


@app.websocket("/api/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "info", "message": "Connected to real-time sales feed"})
        while True:
            # Wait for data or send periodic simulated orders/updates
            await asyncio.sleep(10)
            mock_order = {
                "type": "new_order",
                "order_id": f"ORD-{random.randint(1000, 9999)}",
                "customer": random.choice(["Elon Musk", "Taylor Swift", "Bill Gates", "Grace Hopper", "Tim Cook"]),
                "amount": round(random.uniform(50.0, 1200.0), 2),
                "product": random.choice(["Wireless Earbuds Pro", "Noise Cancelling Headphones", "Premium Leather Jacket", "Mechanical Keyboard", "Ultra HD Smart Monitor"]),
                "timestamp": datetime.now().strftime("%H:%M:%S")
            }
            await websocket.send_json(mock_order)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
