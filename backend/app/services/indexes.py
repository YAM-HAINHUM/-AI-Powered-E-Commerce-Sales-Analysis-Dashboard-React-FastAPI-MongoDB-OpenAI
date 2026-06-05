"""
MongoDB index initialization for user tracking collections.
Creates indexes on user_id and timestamp fields for optimal query performance.
"""

async def init_tracking_indexes(db):
    """Create indexes for all user tracking collections."""
    
    # Helper to create or recreate an index when specs conflict with existing ones
    from pymongo.errors import OperationFailure

    async def ensure_index(coll, keys, **opts):
        # Try creating the index; on spec conflict, find existing index and replace it.
        try:
            await coll.create_index(keys, **opts)
            return
        except OperationFailure as e:
            # If the conflict is due to an existing index with same name but different options,
            # drop that index and recreate with desired options.
            if getattr(e, "codeName", "") == "IndexKeySpecsConflict" or "same name" in str(e):
                existing = await coll.list_indexes().to_list(length=100)
                # Normalize requested keys to list of tuples for comparison
                req_keys = list(keys) if isinstance(keys, (list, tuple)) else list(keys.items())
                for idx in existing:
                    idx_key = list(idx.get("key", {}).items())
                    if idx_key == req_keys:
                        await coll.drop_index(idx["name"])
                        await coll.create_index(keys, **opts)
                        return
            # Re-raise if we couldn't handle it
            raise

    # Users collection indexes
    # Make the user_id unique index sparse so documents without a user_id
    # (e.g. legacy or system records) won't trigger duplicate-null errors.
    # If a legacy index exists for personal_info.email that is non-sparse, drop it first.
    try:
        await db.users.drop_index("personal_info.email_1")
    except Exception:
        pass

    await ensure_index(db.users, [("user_id", 1)], unique=True, sparse=True)
    await ensure_index(db.users, [("email", 1)], unique=True)
    # Ensure nested personal_info.email index is sparse to avoid duplicate-null errors
    await ensure_index(db.users, [("personal_info.email", 1)], unique=True, sparse=True)
    
    # User activity logs indexes
    await db.user_activity_logs.create_index([("user_id", 1), ("timestamp", -1)])
    await db.user_activity_logs.create_index([("user_id", 1), ("action", 1)])
    await db.user_activity_logs.create_index("timestamp")
    
    # Data uploads indexes
    await db.data_uploads.create_index([("user_id", 1), ("upload_time", -1)])
    await db.data_uploads.create_index("upload_time")
    
    # Dashboard tracking indexes
    await db.dashboard_tracking.create_index([("user_id", 1), ("dashboard_id", 1)])
    await db.dashboard_tracking.create_index("user_id")
    
    # AI analytics logs indexes
    await db.ai_analytics_logs.create_index([("user_id", 1), ("timestamp", -1)])
    await db.ai_analytics_logs.create_index("timestamp")
    
    # User alerts indexes
    await db.user_alerts.create_index([("user_id", 1), ("triggered_on", -1)])
    await db.user_alerts.create_index([("user_id", 1), ("status", 1)])
    await db.user_alerts.create_index("triggered_on")
    
    print("✅ User tracking indexes initialized")


async def init_all_indexes(app):
    """Initialize all indexes on app startup."""
    from app.database import get_db
    db = get_db()
    if db is not None:
        await init_tracking_indexes(db)