"""User tracking and analytics service layer."""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import HTTPException

from app.database import get_db
from app.models.user_tracking_schemas import (
    UserDocument,
    UserActivityLog,
    DataUploadTracking,
    DashboardTracking,
    AIAnalyticsLog,
    Alert,
    UserActivitySummary,
)


class UserTrackingService:
    def __init__(self):
        # Don't initialize db here - get it on-demand to avoid init-time connection issues
        self._db = None

    @property
    def db(self):
        """Lazily fetch database connection on-demand."""
        if self._db is None:
            self._db = get_db()
        return self._db


    async def create_or_update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            db = self.db
            if db is None:
                print(f"[create_or_update_user_profile] DB is None for user {user_id}")
                raise HTTPException(status_code=503, detail="Database unavailable")
            
            print(f"[create_or_update_user_profile] Updating profile for user {user_id}")
            print(f"[create_or_update_user_profile] Profile data: {profile_data}")
            
            existing = await db.users.find_one({"user_id": user_id})
            print(f"[create_or_update_user_profile] Existing user found: {bool(existing)}")
            
            if existing:
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {**profile_data, "updated_at": datetime.utcnow()}}
                )
                print(f"[create_or_update_user_profile] Updated existing user")
            else:
                user_doc = {
                    "user_id": user_id,
                    **profile_data,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
                await db.users.insert_one(user_doc)
                print(f"[create_or_update_user_profile] Inserted new user")
            
            result = await self.get_user_profile(user_id)
            print(f"[create_or_update_user_profile] Final profile: {result}")
            return result
        except HTTPException:
            raise
        except Exception as e:
            print(f"[create_or_update_user_profile] Exception: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=503, detail=f"Failed to update profile: {str(e)}")


    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        if self.db is None:
            return {}
        user = await self.db.users.find_one({"user_id": user_id})
        if user:
            user["_id"] = str(user.get("_id", ""))
        return user or {}

    async def log_activity(
        self,
        user_id: str,
        action: str,
        module: str = "dashboard",
        ip_address: str = "",
        device: str = "",
        metadata: Dict[str, Any] = {}
    ) -> str:
        if self.db is None:
            return ""
        
        activity_doc = {
            "user_id": user_id,
            "action": action,
            "module": module,
            "timestamp": datetime.utcnow(),
            "ip_address": ip_address,
            "device": device,
            "metadata": metadata,
        }
        result = await self.db.user_activity_logs.insert_one(activity_doc)
        return str(result.inserted_id)

    async def get_user_activities(
        self, user_id: str, limit: int = 50, skip: int = 0
    ) -> List[Dict[str, Any]]:
        if self.db is None:
            return []
        cursor = self.db.user_activity_logs.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).skip(skip).limit(limit)
        return [self._format_activity(doc) for doc in await cursor.to_list(length=limit)]

    async def log_data_upload(
        self,
        user_id: str,
        file_name: str,
        file_type: str,
        file_size: int,
        columns: List[str],
        rows_count: int,
        data_summary: Dict[str, Any],
        ai_insights_generated: bool = False,
        dataset_id: str = ""
    ) -> str:
        if self.db is None:
            return ""
        
        upload_doc = {
            "user_id": user_id,
            "file_name": file_name,
            "file_type": file_type,
            "file_size": file_size,
            "upload_time": datetime.utcnow(),
            "columns_detected": columns,
            "rows_count": rows_count,
            "data_summary": data_summary,
            "ai_insights_generated": ai_insights_generated,
            "dataset_id": dataset_id,
        }
        result = await self.db.data_uploads.insert_one(upload_doc)
        return str(result.inserted_id)

    async def get_user_uploads(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        if self.db is None:
            return []
        cursor = self.db.data_uploads.find(
            {"user_id": user_id}
        ).sort("upload_time", -1).limit(limit)
        return [self._format_upload(doc) for doc in await cursor.to_list(length=limit)]

    async def track_dashboard_interaction(
        self,
        user_id: str,
        dashboard_id: str,
        chart_type: str,
        data_source: str,
        filters_applied: List[str] = [],
    ) -> Dict[str, Any]:
        if self.db is None:
            return {}
        
        dashboard_doc = await self.db.dashboard_tracking.find_one({
            "user_id": user_id,
            "dashboard_id": dashboard_id
        })
        
        if dashboard_doc:
            visualization = {
                "chart_type": chart_type,
                "data_source": data_source,
                "filters_applied": filters_applied,
                "interaction_count": 1,
                "last_viewed": datetime.utcnow(),
            }
            await self.db.dashboard_tracking.update_one(
                {"_id": dashboard_doc["_id"]},
                {
                    "$inc": {"total_time_spent": 1},
                    "$push": {"visualizations": visualization},
                }
            )
        else:
            dashboard_doc = {
                "user_id": user_id,
                "dashboard_id": dashboard_id,
                "visualizations": [{
                    "chart_type": chart_type,
                    "data_source": data_source,
                    "filters_applied": filters_applied,
                    "interaction_count": 1,
                    "last_viewed": datetime.utcnow(),
                }],
                "total_time_spent": 0,
                "most_used_charts": [],
                "session_start": datetime.utcnow(),
            }
            await self.db.dashboard_tracking.insert_one(dashboard_doc)
        
        return dashboard_doc

    async def log_ai_interaction(
        self,
        user_id: str,
        query: str,
        response: str,
        model_used: str = "OpenAI",
        confidence_score: float = 0.0,
    ) -> str:
        if self.db is None:
            return ""
        
        ai_doc = {
            "user_id": user_id,
            "query": query,
            "response": response,
            "model_used": model_used,
            "timestamp": datetime.utcnow(),
            "confidence_score": confidence_score,
            "feedback": None,
        }
        result = await self.db.ai_analytics_logs.insert_one(ai_doc)
        return str(result.inserted_id)

    async def get_ai_usage_stats(self, user_id: str) -> Dict[str, Any]:
        if self.db is None:
            return {"total_queries": 0, "model_usage": {}, "recent": []}
        
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": None,
                "total_queries": {"$sum": 1},
                "openai_count": {"$sum": {"$cond": [{"$eq": ["$model_used", "OpenAI"]}, 1, 0]}},
                "groq_count": {"$sum": {"$cond": [{"$eq": ["$model_used", "Groq"]}, 1, 0]}},
            }}
        ]
        result = await self.db.ai_analytics_logs.aggregate(pipeline).to_list(length=1)
        stats = result[0] if result else {"total_queries": 0, "openai_count": 0, "groq_count": 0}
        
        stats["model_usage"] = {
            "OpenAI": stats.pop("openai_count", 0),
            "Groq": stats.pop("groq_count", 0),
        }
        
        recent_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"timestamp": -1}},
            {"$limit": 5},
            {"$project": {"query": 1, "timestamp": 1, "model_used": 1, "_id": 0}}
        ]
        stats["recent"] = await self.db.ai_analytics_logs.aggregate(recent_pipeline).to_list(length=5)
        
        return stats

    async def create_alert(
        self,
        user_id: str,
        alert_type: str,
        message: str,
        severity: str = "medium",
        metadata: Dict[str, Any] = {}
    ) -> str:
        if self.db is None:
            return ""
        
        alert_doc = {
            "user_id": user_id,
            "alert_type": alert_type,
            "message": message,
            "severity": severity,
            "triggered_on": datetime.utcnow(),
            "status": "pending",
            "metadata": metadata,
        }
        result = await self.db.user_alerts.insert_one(alert_doc)
        return str(result.inserted_id)

    async def get_user_alerts(self, user_id: str, status: str = "all") -> List[Dict[str, Any]]:
        if self.db is None:
            return []
        
        query = {"user_id": user_id}
        if status != "all":
            query["status"] = status
        
        cursor = self.db.user_alerts.find(query).sort("triggered_on", -1).limit(50)
        return [self._format_alert(doc) for doc in await cursor.to_list(length=50)]

    async def resolve_alert(self, user_id: str, alert_id: str) -> bool:
        if self.db is None:
            return False
        
        result = await self.db.user_alerts.update_one(
            {"_id": alert_id, "user_id": user_id},
            {"$set": {"status": "resolved"}}
        )
        return result.modified_count > 0

    async def get_user_analytics_summary(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        if self.db is None:
            return {}
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        activity_pipeline = [
            {"$match": {"user_id": user_id, "timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": None,
                "total_actions": {"$sum": 1},
                "login_count": {"$sum": {"$cond": [{"$eq": ["$action", "login"]}, 1, 0]}},
                "upload_count": {"$sum": {"$cond": [{"$eq": ["$action", "upload"]}, 1, 0]}},
                "dashboard_views": {"$sum": {"$cond": [{"$eq": ["$action", "view_dashboard"]}, 1, 0]}},
                "ai_interactions": {"$sum": {"$cond": [{"$eq": ["$action", "generate_ai"]}, 1, 0]}},
            }}
        ]
        
        upload_pipeline = [
            {"$match": {"user_id": user_id, "upload_time": {"$gte": start_date}}},
            {"$group": {
                "_id": None,
                "total_files": {"$sum": 1},
                "total_rows": {"$sum": "$rows_count"},
                "total_size": {"$sum": "$file_size"},
            }}
        ]
        
        activity_result = await self.db.user_activity_logs.aggregate(activity_pipeline).to_list(length=1)
        upload_result = await self.db.data_uploads.aggregate(upload_pipeline).to_list(length=1)
        
        summary = activity_result[0] if activity_result else {}
        uploads = upload_result[0] if upload_result else {}
        
        return {
            "period_days": days,
            "total_actions": summary.get("total_actions", 0),
            "logins": summary.get("login_count", 0),
            "uploads": summary.get("upload_count", 0),
            "dashboard_views": summary.get("dashboard_views", 0),
            "ai_interactions": summary.get("ai_interactions", 0),
            "files_uploaded": uploads.get("total_files", 0),
            "total_rows_processed": uploads.get("total_rows", 0),
            "total_data_size_bytes": uploads.get("total_size", 0),
        }

    async def get_daily_activity_heatmap(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        if self.db is None:
            return []
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        pipeline = [
            {"$match": {"user_id": user_id, "timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                    "hour": {"$hour": "$timestamp"},
                },
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id.date": 1, "_id.hour": 1}},
        ]
        
        return await self.db.user_activity_logs.aggregate(pipeline).to_list(length=days * 24)

    async def export_user_activity_report(self, user_id: str, format: str = "json") -> Dict[str, Any]:
        if self.db is None:
            return {}
        
        activities = await self.get_user_activities(user_id, limit=1000)
        uploads = await self.get_user_uploads(user_id, limit=100)
        alerts = await self.get_user_alerts(user_id)
        summary = await self.get_user_analytics_summary(user_id)
        
        if format == "csv":
            return {
                "data": {
                    "activities": len(activities),
                    "uploads": len(uploads),
                    "alerts": len(alerts),
                },
                "format": "csv",
                "download_url": f"/api/user-tracking/export/csv/{user_id}",
            }
        
        return {
            "user_id": user_id,
            "summary": summary,
            "activities": activities,
            "uploads": uploads,
            "alerts": alerts,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def _format_activity(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc["_id"] = str(doc.get("_id", ""))
        doc["timestamp"] = doc.get("timestamp", datetime.utcnow()).isoformat()
        return doc

    def _format_upload(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc["_id"] = str(doc.get("_id", ""))
        doc["upload_time"] = doc.get("upload_time", datetime.utcnow()).isoformat()
        return doc

    def _format_alert(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc["_id"] = str(doc.get("_id", ""))
        doc["triggered_on"] = doc.get("triggered_on", datetime.utcnow()).isoformat()
        return doc


user_tracking_service = UserTrackingService()