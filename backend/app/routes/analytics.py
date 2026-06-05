"""
Analytics routes — monthly sales, top customers, categories, products.
"""
from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.services.sql_service import run_predefined_query

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/monthly-sales")
async def monthly_sales(_: dict = Depends(get_current_user)):
    return await run_predefined_query("monthly_sales_trend")


@router.get("/top-customers")
async def top_customers(_: dict = Depends(get_current_user)):
    return await run_predefined_query("top_customers")


@router.get("/category-revenue")
async def category_revenue(_: dict = Depends(get_current_user)):
    return await run_predefined_query("category_revenue")


@router.get("/best-selling-products")
async def best_selling_products(_: dict = Depends(get_current_user)):
    return await run_predefined_query("best_selling_products")


@router.get("/customer-ranking")
async def customer_ranking(_: dict = Depends(get_current_user)):
    return await run_predefined_query("customer_ranking")
