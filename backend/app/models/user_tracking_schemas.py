"""User tracking and analytics schemas for MongoDB collections."""
from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field


class PersonalInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    profile_picture: str = ""
    role: str = "analyst"
    organization: str = ""


class AccountSettings(BaseModel):
    theme: Literal["dark", "light"] = "light"
    language: str = "en"
    notifications: bool = True
    timezone: str = ""


class SecurityInfo(BaseModel):
    last_login: Optional[datetime] = None
    login_history: List[Dict[str, Any]] = []
    two_fa_enabled: bool = False
    devices: List[Dict[str, Any]] = []


class SubscriptionInfo(BaseModel):
    plan: Literal["free", "pro", "enterprise"] = "free"
    usage_limits: Dict[str, Any] = {}
    billing_info: Dict[str, Any] = {}


class UserDocument(BaseModel):
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    account_settings: AccountSettings = Field(default_factory=AccountSettings)
    security: SecurityInfo = Field(default_factory=SecurityInfo)
    subscription: SubscriptionInfo = Field(default_factory=SubscriptionInfo)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserActivityLog(BaseModel):
    user_id: str
    action: Literal["login", "logout", "upload", "view_dashboard", "export_report", "view_chart", "apply_filter", "generate_ai", "download"]
    module: Literal["dashboard", "profile", "analytics", "upload", "ai", "settings"] = "dashboard"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: str = ""
    device: str = ""
    metadata: Dict[str, Any] = {}


class DataUploadTracking(BaseModel):
    user_id: str
    file_name: str
    file_type: Literal["csv", "xlsx", "json"] = "csv"
    file_size: int = 0
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    columns_detected: List[str] = []
    rows_count: int = 0
    data_summary: Dict[str, Any] = {}
    ai_insights_generated: bool = False
    dataset_id: str = ""


class VisualizationInteraction(BaseModel):
    chart_type: Literal["bar", "line", "pie", "area", "scatter", "heatmap"]
    data_source: str = ""
    filters_applied: List[str] = []
    interaction_count: int = 0
    last_viewed: datetime = Field(default_factory=datetime.utcnow)


class DashboardTracking(BaseModel):
    user_id: str
    dashboard_id: str = ""
    visualizations: List[VisualizationInteraction] = []
    total_time_spent: int = 0
    most_used_charts: List[str] = []
    session_start: Optional[datetime] = None


class AIAnalyticsLog(BaseModel):
    user_id: str
    query: str
    response: str
    model_used: Literal["LLM", "Groq", "OpenAI"] = "OpenAI"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float = 0.0
    feedback: Optional[Literal["like", "dislike"]] = None


class Alert(BaseModel):
    user_id: str
    alert_type: Literal["anomaly", "KPI drop", "threshold", "activity"] = "anomaly"
    message: str
    severity: Literal["low", "medium", "high"] = "medium"
    triggered_on: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["resolved", "pending"] = "pending"
    metadata: Dict[str, Any] = {}


class UserActivitySummary(BaseModel):
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    total_actions: int = 0
    actions_by_type: Dict[str, int] = {}
    time_spent_minutes: int = 0
    features_used: List[str] = []