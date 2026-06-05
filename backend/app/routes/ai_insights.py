"""
AI Insights routes — generate insights, NLP to SQL, recommendations, summary.
"""
from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.services.ai_service import (
    generate_insight,
    natural_language_to_sql,
    get_smart_recommendations,
)
from app.models.schemas import AIInsightRequest, SQLQueryRequest
from app.services.user_tracking_service import user_tracking_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai-insights", tags=["ai"])


class NLPQueryRequest(BaseModel):
    question: str


@router.post("/generate")
async def get_insight(payload: AIInsightRequest, current_user: dict = Depends(get_current_user)):
    """Generate AI business insight of a given type."""
    user_id = current_user.get("sub")
    content = await generate_insight(payload.insight_type, payload.context)
    
    # Log AI interaction
    await user_tracking_service.log_ai_interaction(
        user_id=user_id,
        query=f"Generate {payload.insight_type} insight",
        response=content,
        model_used="OpenAI",
        confidence_score=0.95
    )
    
    await user_tracking_service.log_activity(
        user_id=user_id,
        action="generate_ai",
        module="ai",
        metadata={"insight_type": payload.insight_type}
    )
    
    return {"insight": content, "type": payload.insight_type}


@router.post("/nlp-to-sql")
async def nlp_to_sql(payload: NLPQueryRequest, _: dict = Depends(get_current_user)):
    """Convert a natural language question to a SQL query."""
    sql = await natural_language_to_sql(payload.question)
    return {"sql": sql, "question": payload.question}


@router.get("/recommendations")
async def recommendations(_: dict = Depends(get_current_user)):
    """Get smart business recommendations."""
    recs = await get_smart_recommendations()
    return {"recommendations": recs}


@router.get("/summary")
async def auto_summary(_: dict = Depends(get_current_user)):
    """Auto-generate an executive summary from dashboard data."""
    content = await generate_insight("summary")
    return {"summary": content}
