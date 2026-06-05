"""
Upload routes — CSV/Excel ingestion, processing, AI insights, export.
"""
from __future__ import annotations

import io
import json
import uuid
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse

from app.database import get_db, get_sqlite_connection
from app.middleware.auth import get_current_user
from app.services.upload_service import (
    calculate_metrics,
    clean_dataframe,
    detect_schema,
    generate_ai_insights,
    generate_pdf_report,
)

router = APIRouter(prefix="/api/upload", tags=["upload"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _parse_file(contents: bytes, filename: str) -> pd.DataFrame:
    fname = filename.lower()
    if fname.endswith(".csv"):
        # Try multiple encodings
        for enc in ("utf-8", "latin-1", "cp1252"):
            try:
                return pd.read_csv(io.BytesIO(contents), encoding=enc)
            except UnicodeDecodeError:
                continue
        raise HTTPException(400, "Could not decode CSV file — try saving as UTF-8")
    elif fname.endswith((".xls", ".xlsx")):
        return pd.read_excel(io.BytesIO(contents))
    else:
        raise HTTPException(400, "Only CSV (.csv) or Excel (.xls/.xlsx) files are supported")


# ── POST /api/upload/dataset ──────────────────────────────────────────────────
@router.post("/dataset")
async def upload_dataset(
    file: UploadFile = File(...),
    auto_clean: bool = Form(True),
    current_user: dict = Depends(get_current_user),
):
    """
    Parse, clean, compute metrics, generate AI insights, sync to SQLite.
    Returns full analysis payload.
    """
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(413, "File too large — maximum 20 MB allowed")

    df = _parse_file(contents, file.filename or "upload")
    if df.empty:
        raise HTTPException(400, "Uploaded file is empty")

    total_rows = len(df)
    total_cols = len(df.columns)

    # 1. Detect schema
    schema = detect_schema(df)

    # 2. Clean data
    clean_df, clean_report = clean_dataframe(df, schema) if auto_clean else (df, {})

    # 3. Compute metrics
    metrics = calculate_metrics(clean_df, schema)

    # 4. AI insights
    insights = await generate_ai_insights(metrics, file.filename or "dataset")

    # 5. Preview (first 10 rows, serialisable)
    preview_df = clean_df.head(10).copy()
    for col in preview_df.select_dtypes(include=["datetime64[ns]", "datetime64[ns, UTC]"]).columns:
        preview_df[col] = preview_df[col].astype(str)
    preview = preview_df.to_dict("records")

    # 6. Column info
    column_info = []
    for col in df.columns:
        ctype = schema["col_types"].get(col, "categorical")
        null_pct = round(df[col].isnull().mean() * 100, 1)
        column_info.append({"name": col, "type": ctype, "null_pct": null_pct})

    # 7. Persist to MongoDB
    dataset_id = str(uuid.uuid4())
    db = get_db()
    tenant_id = current_user.get("tenant_id")

    if db is not None:
        try:
            await db.uploaded_datasets.insert_one({
                "dataset_id": dataset_id,
                "filename": file.filename,
                "uploaded_at": datetime.utcnow().isoformat(),
                "tenant_id": tenant_id,
                "user_id": current_user.get("sub"),
                "total_rows": total_rows,
                "total_cols": total_cols,
                "schema": schema,
                "metrics": _make_serialisable(metrics),
                "insights": insights,
                "clean_report": clean_report,
            })
        except Exception:
            pass  # MongoDB optional — continue without it

    # 8. Sync orders to SQLite if order-shaped
    mapped = schema["mapped"]
    sqlite_synced = 0
    if mapped["amount_col"]:
        try:
            async with await get_sqlite_connection(tenant_id=tenant_id) as conn:
                for _, row in clean_df.iterrows():
                    order_id   = str(row.get(mapped.get("order_id_col") or "order_id", uuid.uuid4()))
                    customer   = str(row.get(mapped["customer_col"], "UNKNOWN")) if mapped["customer_col"] else "UNKNOWN"
                    order_date = str(row.get(mapped["date_col"], "2024-01-01")) if mapped["date_col"] else "2024-01-01"
                    amount     = float(row.get(mapped["amount_col"], 0) or 0)
                    await conn.execute(
                        "INSERT OR IGNORE INTO orders (order_id, customer_id, order_date, amount) VALUES (?,?,?,?)",
                        (order_id, customer, order_date, amount),
                    )
                    sqlite_synced += 1
                await conn.commit()
        except Exception:
            pass  # Non-fatal

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "file": {"name": file.filename, "rows": total_rows, "cols": total_cols},
        "column_info": column_info,
        "clean_report": clean_report,
        "metrics": _make_serialisable(metrics),
        "insights": insights,
        "preview": preview,
        "sqlite_synced": sqlite_synced,
    }


# ── GET /api/upload/sample ────────────────────────────────────────────────────
@router.get("/sample")
async def get_sample_dataset(current_user: dict = Depends(get_current_user)):
    """Return a pre-built sample dataset as CSV download."""
    import random
    from datetime import timedelta

    random.seed(42)
    products = [
        ("Wireless Headphones", "Electronics", 89.99),
        ("Smart Watch", "Electronics", 199.99),
        ("Running Shoes", "Sports", 74.99),
        ("Coffee Maker", "Home & Garden", 59.99),
        ("Yoga Mat", "Sports", 29.99),
        ("Laptop Stand", "Electronics", 49.99),
        ("Water Bottle", "Sports", 19.99),
        ("Desk Lamp", "Home & Garden", 34.99),
        ("Backpack", "Fashion", 54.99),
        ("Sunglasses", "Fashion", 44.99),
        ("Novel: The Algorithm", "Books", 14.99),
        ("Python Cookbook", "Books", 39.99),
    ]
    cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Seattle", "Miami", "Boston"]
    payments = ["Credit Card", "PayPal", "Debit Card", "Apple Pay", "Bank Transfer"]
    customers = [f"Customer_{i:03d}" for i in range(1, 51)]

    rows = []
    base_date = datetime(2024, 1, 1)
    for i in range(300):
        prod, cat, price = random.choice(products)
        qty = random.randint(1, 5)
        order_date = base_date + timedelta(days=random.randint(0, 364))
        rows.append({
            "order_id": f"ORD-{i+1:04d}",
            "customer_name": random.choice(customers),
            "product_name": prod,
            "category": cat,
            "quantity": qty,
            "unit_price": price,
            "amount": round(price * qty, 2),
            "order_date": order_date.strftime("%Y-%m-%d"),
            "city": random.choice(cities),
            "payment_method": random.choice(payments),
        })

    df = pd.DataFrame(rows)
    csv_bytes = df.to_csv(index=False).encode()
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_ecommerce_data.csv"},
    )


# ── POST /api/upload/export-pdf ───────────────────────────────────────────────
@router.post("/export-pdf")
async def export_pdf(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Generate and return a PDF report from previously computed metrics + insights."""
    try:
        pdf_bytes = generate_pdf_report(
            filename=payload.get("filename", "dataset"),
            metrics=payload.get("metrics", {}),
            insights=payload.get("insights", {}),
            clean_report=payload.get("clean_report", {}),
        )
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=datainsight_report.pdf"},
    )


# ── POST /api/upload/export-csv ───────────────────────────────────────────────
@router.post("/export-csv")
async def export_csv(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Return processed data as CSV download."""
    rows = payload.get("preview", [])
    if not rows:
        raise HTTPException(400, "No data to export")
    df = pd.DataFrame(rows)
    csv_str = df.to_csv(index=False)
    return Response(
        content=csv_str.encode(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=processed_data.csv"},
    )


# ── Helpers ───────────────────────────────────────────────────────────────────
def _make_serialisable(obj):
    """Recursively convert numpy/pandas types to Python native."""
    if isinstance(obj, dict):
        return {k: _make_serialisable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_make_serialisable(i) for i in obj]
    if isinstance(obj, float) and (obj != obj):  # NaN
        return None
    if hasattr(obj, "item"):  # numpy scalar
        return obj.item()
    return obj
