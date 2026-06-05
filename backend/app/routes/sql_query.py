"""
SQL query routes — custom query execution and predefined query execution.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.services.sql_service import run_custom_query, run_predefined_query, PREDEFINED_QUERIES
from app.models.schemas import SQLQueryRequest
from app.database import get_db
from datetime import datetime

router = APIRouter(prefix="/api/sql-query", tags=["sql"])


@router.post("")
async def execute_query(payload: SQLQueryRequest, current_user: dict = Depends(get_current_user)):
    """Execute a custom or NLP-converted SQL query."""
    try:
        result = await run_custom_query(payload.query)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Log the query to MongoDB
    db = get_db()
    if db is not None:
        await db.query_logs.insert_one({
            "user_email": current_user.get("email"),
            "query": payload.query,
            "natural_language": payload.natural_language,
            "row_count": result["row_count"],
            "execution_time_ms": result["execution_time_ms"],
            "timestamp": datetime.utcnow(),
        })

    return result


@router.get("/predefined")
async def list_predefined(_: dict = Depends(get_current_user)):
    """List all available predefined query names and their SQL."""
    return {
        "queries": [
            {"name": k, "sql": v.strip()}
            for k, v in PREDEFINED_QUERIES.items()
        ]
    }


@router.get("/predefined/{query_name}")
async def execute_predefined(query_name: str, _: dict = Depends(get_current_user)):
    try:
        return await run_predefined_query(query_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
