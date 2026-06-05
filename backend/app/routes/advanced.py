"""
Advanced AI Analytics Routes.
Registers endpoints for forecast, anomalies, recommendations, segments, churn, product scores, and pricing.
"""
from fastapi import APIRouter, Depends, Query
from app.middleware.auth import get_current_user
from app.services import (
    forecast_service,
    anomaly_service,
    segmentation_service,
    recommendation_service,
    advanced_analytics_service,
    churn_service,
    product_score_service,
    pricing_service,
    ai_service
)

router = APIRouter(prefix="/api", tags=["advanced-ai"])

@router.get("/forecast")
async def get_forecast(_: dict = Depends(get_current_user)):
    """Predict future revenue using linear regression."""
    return await forecast_service.get_revenue_forecast()

@router.get("/anomaly")
@router.get("/anomalies")
async def get_anomalies(_: dict = Depends(get_current_user)):
    """Detect unusual spikes/drops in daily sales. Supports both /anomaly and /anomalies."""
    return await anomaly_service.detect_anomalies()

@router.get("/segmentation")
@router.get("/segments")
async def get_segmentation(_: dict = Depends(get_current_user)):
    """Customer segmentation using RFM analysis and K-Means. Supports both /segmentation and /segments."""
    return await segmentation_service.get_customer_segments()

@router.get("/recommendation")
@router.get("/recommendations")
async def get_recommendations(
    product_id: str = Query(None, description="Product ID to get recommendations for"),
    top_n: int = Query(5, description="Number of recommendations to return"),
    _: dict = Depends(get_current_user)
):
    """
    Returns both smart business recommendations and database product co-purchase recommendations.
    Supports both /recommendation and /recommendations.
    """
    # 1. Fetch co-purchase data association rules
    copurchase_data = await recommendation_service.get_product_recommendations(product_id, top_n)
    # 2. Fetch business recommendations
    smart_recs = await ai_service.get_smart_recommendations()
    
    return {
        "co_purchases": copurchase_data,
        "smart_recommendations": smart_recs
    }

@router.get("/churn")
async def get_churn_prediction(_: dict = Depends(get_current_user)):
    """Predict customers likely to churn based on recency/frequency metrics."""
    return await churn_service.predict_churn()

@router.get("/product-score")
async def get_product_score(_: dict = Depends(get_current_user)):
    """Compute product performance scores and letter grades."""
    return await product_score_service.compute_product_scores()

@router.get("/pricing")
async def get_pricing_recommendations(_: dict = Depends(get_current_user)):
    """Suggest price optimizations based on sales demand velocity."""
    return await pricing_service.analyze_pricing()

@router.get("/clv")
async def get_clv(_: dict = Depends(get_current_user)):
    """Customer Lifetime Value analysis."""
    return await advanced_analytics_service.get_clv_analysis()

@router.get("/city-revenue")
async def get_city_revenue(_: dict = Depends(get_current_user)):
    """City-wise revenue breakdown."""
    return await advanced_analytics_service.get_city_revenue()

@router.get("/cohort")
async def get_cohort(_: dict = Depends(get_current_user)):
    """Cohort retention analysis."""
    return await advanced_analytics_service.get_cohort_analysis()

@router.get("/retention")
async def get_retention(_: dict = Depends(get_current_user)):
    """Customer retention and repeat purchase rate."""
    return await advanced_analytics_service.get_retention_analysis()
