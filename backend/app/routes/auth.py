"""
Authentication routes — signup, login, and current-user endpoint.
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from app.database import get_db
from app.middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.schemas import UserCreate, UserLogin, Token
from datetime import datetime
from app.middleware.tracking_middleware import log_login_activity
from bson.objectid import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=Token)
async def signup(payload: UserCreate):
    import traceback
    db = get_db()
    try:
        print('[signup] checking existing')
        # Check for existing email
        existing = await db.users.find_one({"email": payload.email})
        print('[signup] existing check done', bool(existing))
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_doc = {
            "username": payload.username,
            "email": payload.email,
            "full_name": payload.full_name or payload.username,
            "personal_info": {"email": payload.email, "full_name": payload.full_name or payload.username},
            "hashed_password": hash_password(payload.password),
            "created_at": datetime.utcnow(),
            "role": "analyst",
        }
        print('[signup] prepared user_doc')
        result = await db.users.insert_one(user_doc)
        print('[signup] insert result', result.inserted_id)
        user_id = str(result.inserted_id)
        
        # Update the document to include user_id field  (same as MongoDB _id)
        await db.users.update_one(
            {"_id": result.inserted_id},
            {"$set": {"user_id": user_id}}
        )
        print('[signup] added user_id field')

        # Tenant is assigned at signup (Phase 1 skeleton). For now create a 1:1 tenant.
        tenant_id = str(result.inserted_id)
        print('[signup] creating token')
        token = create_access_token({"sub": user_id, "email": payload.email, "role": "analyst", "tenant_id": tenant_id})
        print('[signup] token created')

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user_id, "email": payload.email, "username": payload.username, "full_name": user_doc["full_name"]},
        }
    except Exception as exc:
        # Log full traceback to server console for debugging
        print("[signup] Exception while creating user:")
        traceback.print_exc()
        raise


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, request: Request):
    db = get_db()
    user = await db.users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_id = str(user["_id"])
    token = create_access_token({
        "sub": user_id,
        "email": user["email"],
        "role": user.get("role", "analyst"),
        "tenant_id": str(user.get("tenant_id", user_id)),
    })
    
    # Update last login and log activity
    ip_address = request.client.host if request.client else ""
    device = request.headers.get("user-agent", "")[:100]
    
    await log_login_activity(user_id, ip_address, device)
    
    if db is not None:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()},
             "$push": {"login_history": {"ip": ip_address, "device": device, "timestamp": datetime.utcnow()}}}
        )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user["email"],
            "username": user["username"],
            "full_name": user.get("full_name", user["username"]),
        },
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
