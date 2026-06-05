"""Request logging middleware for automatic user activity tracking."""
from typing import Callable, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from starlette.responses import Response as StarletteResponse
import time

from app.middleware.auth import decode_token
from app.services.user_tracking_service import user_tracking_service


class UserActivityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> StarletteResponse:
        if request.url.path.startswith("/api/") and request.url.path not in ["/api/auth/login", "/api/auth/signup", "/api/health"]:
            start_time = time.time()
            
        response = await call_next(request)
        
        if request.url.path.startswith("/api/") and request.url.path not in ["/api/auth/login", "/api/auth/signup", "/api/health"]:
            duration_ms = int((time.time() - start_time) * 1000)
            
            authorization = request.headers.get("authorization", "")
            user_id = None
            
            if authorization.startswith("Bearer "):
                token = authorization[7:]
                try:
                    payload = decode_token(token)
                    user_id = payload.get("sub")
                except Exception:
                    pass
            
            if user_id:
                action = self._map_action(request.method, request.url.path)
                if action:
                    metadata = {
                        "endpoint": request.url.path,
                        "duration_ms": duration_ms,
                        "status_code": response.status_code,
                    }
                    
                    module = self._get_module(request.url.path)
                    
                    await user_tracking_service.log_activity(
                        user_id=user_id,
                        action=action,
                        module=module,
                        ip_address=request.client.host if request.client else "",
                        metadata=metadata
                    )
        
        return response

    def _map_action(self, method: str, path: str) -> Optional[str]:
        path_parts = path.split("/")
        
        if "dashboard" in path_parts:
            if method == "GET":
                return "view_dashboard"
            elif method == "POST":
                return "create_dashboard"
        
        if "upload" in path_parts:
            if method == "POST":
                return "upload"
            elif method in ["GET", "DOWNLOAD"]:
                return "download"
        
        if "ai-insights" in path_parts or "analytics" in path_parts:
            if method == "POST":
                return "generate_ai"
        
        if "customers" in path_parts:
            if method == "GET":
                return "view_customers"
        
        if "report" in path_parts:
            if method == "POST" or method == "GET":
                return "export_report"
        
        return None

    def _get_module(self, path: str) -> str:
        path_parts = path.split("/")
        
        if "dashboard" in path_parts:
            return "dashboard"
        if "upload" in path_parts:
            return "upload"
        if "ai-insights" in path_parts or "analytics" in path_parts:
            return "ai"
        if "customers" in path_parts:
            return "customers"
        if "profile" in path_parts:
            return "profile"
        
        return "dashboard"


async def log_login_activity(user_id: str, ip_address: str = "", device: str = ""):
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="login",
        module="auth",
        ip_address=ip_address,
        metadata={"device": device}
    )


async def log_logout_activity(user_id: str, ip_address: str = ""):
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="logout",
        module="auth",
        ip_address=ip_address,
        metadata={}
    )