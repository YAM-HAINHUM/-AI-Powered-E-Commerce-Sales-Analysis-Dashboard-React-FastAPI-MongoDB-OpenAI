"""User tracking and analytics API routes."""
from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, WebSocket, WebSocketDisconnect, Body
from fastapi.responses import JSONResponse

from app.middleware.auth import get_current_user
from app.services.user_tracking_service import user_tracking_service
from app.services.websocket_manager import manager
from pydantic import BaseModel


class ProfileUpdateRequest(BaseModel):
    personal_info: Optional[Dict[str, Any]] = None
    account_settings: Optional[Dict[str, Any]] = None

router = APIRouter(prefix="/api/user-tracking", tags=["user-tracking"])


@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    profile = await user_tracking_service.get_user_profile(user_id)
    return {"profile": profile}


@router.post("/profile")
async def update_user_profile(
    payload: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        from app.database import get_db
        user_id = current_user.get("sub")
        db = get_db()
        
        print(f"[update_user_profile] START - user: {user_id}")
        print(f"[update_user_profile] db instance: {db}, type: {type(db)}")
        print(f"[update_user_profile] payload: personal_info={payload.personal_info}, account_settings={payload.account_settings}")
        
        if db is None:
            print(f"[update_user_profile] ERROR - db is None!")
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Build profile data
        profile_data = {}
        if payload.personal_info:
            profile_data["personal_info"] = payload.personal_info
        if payload.account_settings:
            profile_data["account_settings"] = payload.account_settings
        
        print(f"[update_user_profile] profile_data to save: {profile_data}")
        
        # Try to find existing user
        existing = await db.users.find_one({"user_id": user_id})
        print(f"[update_user_profile] existing user found: {bool(existing)}")
        
        if existing:
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {**profile_data, "updated_at": str(datetime.utcnow())}}
            )
            print(f"[update_user_profile] Updated existing user")
        else:
            user_doc = {
                "user_id": user_id,
                **profile_data,
                "created_at": str(datetime.utcnow()),
                "updated_at": str(datetime.utcnow()),
            }
            await db.users.insert_one(user_doc)
            print(f"[update_user_profile] Inserted new document for user")
        
        # Get and return updated profile (convert ObjectId to string for JSON serialization)
        user = await db.users.find_one({"user_id": user_id})
        if user:
            user["_id"] = str(user.get("_id", ""))
        print(f"[update_user_profile] SUCCESS - returning profile")
        return {"profile": user or {}}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_user_profile] EXCEPTION: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=503, detail=f"Error: {str(e)}")



@router.post("/activity-log")
async def log_user_activity(
    action: str,
    module: str = "dashboard",
    metadata: Dict[str, Any] = {},
    request: Request = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    ip_address = request.client.host if request else ""
    
    activity_id = await user_tracking_service.log_activity(
        user_id=user_id,
        action=action,
        module=module,
        ip_address=ip_address,
        metadata=metadata
    )
    
    return {"activity_id": activity_id, "status": "logged"}


@router.get("/activity-log")
async def get_user_activities(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    activities = await user_tracking_service.get_user_activities(user_id, limit, skip)
    return {"activities": activities}


@router.get("/summary")
async def get_user_activity_summary(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    summary = await user_tracking_service.get_user_analytics_summary(user_id, days)
    return summary


@router.get("/heatmap")
async def get_activity_heatmap(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    heatmap = await user_tracking_service.get_daily_activity_heatmap(user_id, days)
    return {"heatmap": heatmap}


@router.post("/upload/data")
async def track_data_upload(
    file_name: str,
    file_type: str,
    file_size: int,
    columns: list = [],
    rows_count: int = 0,
    data_summary: Dict[str, Any] = {},
    ai_insights_generated: bool = False,
    dataset_id: str = "",
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    upload_id = await user_tracking_service.log_data_upload(
        user_id=user_id,
        file_name=file_name,
        file_type=file_type,
        file_size=file_size,
        columns=columns,
        rows_count=rows_count,
        data_summary=data_summary,
        ai_insights_generated=ai_insights_generated,
        dataset_id=dataset_id
    )
    
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="upload",
        module="upload",
        metadata={"file_name": file_name, "rows": rows_count}
    )
    
    return {"upload_id": upload_id, "status": "tracked"}


@router.get("/uploads")
async def get_user_uploads(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    uploads = await user_tracking_service.get_user_uploads(user_id, limit)
    return {"uploads": uploads}


@router.post("/dashboard/track")
async def track_dashboard_interaction(
    dashboard_id: str,
    chart_type: str,
    data_source: str,
    filters_applied: list = [],
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    result = await user_tracking_service.track_dashboard_interaction(
        user_id=user_id,
        dashboard_id=dashboard_id,
        chart_type=chart_type,
        data_source=data_source,
        filters_applied=filters_applied
    )
    
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="view_chart",
        module="dashboard",
        metadata={"chart_type": chart_type, "dashboard_id": dashboard_id}
    )
    
    return {"status": "tracked", "interaction": result}


@router.post("/analytics/ai-log")
async def log_ai_interaction(
    query: str,
    response: str,
    model_used: str = "OpenAI",
    confidence_score: float = 0.0,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    ai_log_id = await user_tracking_service.log_ai_interaction(
        user_id=user_id,
        query=query,
        response=response,
        model_used=model_used,
        confidence_score=confidence_score
    )
    
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="generate_ai",
        module="ai",
        metadata={"query": query[:100]}
    )
    
    return {"ai_log_id": ai_log_id, "status": "logged"}


@router.get("/analytics/ai-usage")
async def get_ai_usage_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    stats = await user_tracking_service.get_ai_usage_stats(user_id)
    return stats


@router.post("/alerts")
async def create_user_alert(
    alert_type: str,
    message: str,
    severity: str = "medium",
    metadata: Dict[str, Any] = {},
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    alert_id = await user_tracking_service.create_alert(
        user_id=user_id,
        alert_type=alert_type,
        message=message,
        severity=severity,
        metadata=metadata
    )
    
    return {"alert_id": alert_id, "status": "created"}


@router.get("/alerts")
async def get_user_alerts(
    status: str = "all",
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    alerts = await user_tracking_service.get_user_alerts(user_id, status)
    return {"alerts": alerts}


@router.patch("/alerts/{alert_id}/resolve")
async def resolve_user_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    resolved = await user_tracking_service.resolve_alert(user_id, alert_id)
    
    if resolved:
        return {"status": "resolved"}
    raise HTTPException(status_code=404, detail="Alert not found")


@router.get("/export")
async def export_user_activity(
    format: str = "json",
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    report = await user_tracking_service.export_user_activity_report(user_id, format)
    return report


@router.post("/interactions/chart-click")
async def track_chart_click(
    chart_type: str,
    chart_id: str,
    dashboard_id: str,
    metadata: Dict[str, Any] = {},
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="chart_click",
        module="dashboard",
        metadata={"chart_type": chart_type, "chart_id": chart_id, "dashboard_id": dashboard_id, **metadata}
    )
    
    await user_tracking_service.track_dashboard_interaction(
        user_id=user_id,
        dashboard_id=dashboard_id,
        chart_type=chart_type,
        data_source=chart_id
    )
    
    return {"status": "tracked"}


@router.post("/interactions/filter")
async def track_filter_usage(
    filter_type: str,
    filter_value: str,
    dashboard_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="apply_filter",
        module="dashboard",
        metadata={"filter_type": filter_type, "filter_value": filter_value, "dashboard_id": dashboard_id}
    )
    
    return {"status": "tracked"}


@router.post("/interactions/time-spent")
async def track_time_spent(
    dashboard_id: str,
    seconds: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    
    if user_tracking_service.db is not None:
        await user_tracking_service.db.dashboard_tracking.update_one(
            {"user_id": user_id, "dashboard_id": dashboard_id},
            {"$inc": {"total_time_spent": seconds}},
            upsert=True
        )
    
    return {"status": "tracked"}


@router.websocket("/ws/{user_id}")
async def user_tracking_websocket(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time user activity tracking."""
    await manager.connect_user(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast_user_activity(user_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)