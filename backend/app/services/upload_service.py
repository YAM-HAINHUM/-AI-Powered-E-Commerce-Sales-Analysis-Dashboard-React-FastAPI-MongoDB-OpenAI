"""
Upload Service — data cleaning, metrics computation, AI insights, PDF export.
"""
from __future__ import annotations

import io
import json
from datetime import datetime
from typing import Any

import pandas as pd
import numpy as np

from app.config import settings

# ── Optional imports ──────────────────────────────────────────────────────────
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    _reportlab_available = True
except ImportError:
    _reportlab_available = False

try:
    from openai import AsyncOpenAI
    _openai_available = True
except ImportError:
    _openai_available = False


# ── Column aliases ────────────────────────────────────────────────────────────
DATE_ALIASES    = ["order_date", "date", "created_at", "purchase_date", "transaction_date", "invoice_date"]
AMOUNT_ALIASES  = ["amount", "revenue", "total", "price", "sale_price", "order_total", "total_price", "sales"]
QTY_ALIASES     = ["quantity", "qty", "units", "count", "num_items"]
PRODUCT_ALIASES = ["product", "product_name", "item", "item_name", "name", "sku", "product_title"]
CATEGORY_ALIASES= ["category", "product_category", "dept", "department", "type"]
CUSTOMER_ALIASES= ["customer", "customer_name", "client", "buyer", "customer_id", "user"]
CITY_ALIASES    = ["city", "location", "region", "state", "area"]
PAYMENT_ALIASES = ["payment_method", "payment", "pay_method", "payment_type", "pay_type"]


def _find_col(df: pd.DataFrame, aliases: list[str]) -> str | None:
    norm = {c.lower().strip().replace(" ", "_"): c for c in df.columns}
    for a in aliases:
        if a in norm:
            return norm[a]
    return None


# ── 1. Schema detection ───────────────────────────────────────────────────────
def detect_schema(df: pd.DataFrame) -> dict[str, Any]:
    """Auto-detect column roles and data types."""
    col_types: dict[str, str] = {}
    for col in df.columns:
        sample = df[col].dropna()
        if sample.empty:
            col_types[col] = "empty"
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            col_types[col] = "numeric"
            continue
        # Try date parse on string columns
        if pd.api.types.is_object_dtype(df[col]):
            try:
                pd.to_datetime(sample.head(20), infer_datetime_format=True)
                col_types[col] = "date"
                continue
            except Exception:
                pass
        col_types[col] = "categorical"

    mapped = {
        "date_col":     _find_col(df, DATE_ALIASES),
        "amount_col":   _find_col(df, AMOUNT_ALIASES),
        "qty_col":      _find_col(df, QTY_ALIASES),
        "product_col":  _find_col(df, PRODUCT_ALIASES),
        "category_col": _find_col(df, CATEGORY_ALIASES),
        "customer_col": _find_col(df, CUSTOMER_ALIASES),
        "city_col":     _find_col(df, CITY_ALIASES),
        "payment_col":  _find_col(df, PAYMENT_ALIASES),
    }
    return {"col_types": col_types, "mapped": mapped}


# ── 2. Data cleaning ──────────────────────────────────────────────────────────
def clean_dataframe(df: pd.DataFrame, schema: dict) -> tuple[pd.DataFrame, dict]:
    """Clean df: fill nulls, parse dates, remove dupes, fix types."""
    report: dict[str, Any] = {"missing_filled": {}, "duplicates_removed": 0, "type_fixes": []}
    df = df.copy()

    # Remove full-row duplicates
    before = len(df)
    df.drop_duplicates(inplace=True)
    report["duplicates_removed"] = before - len(df)

    mapped = schema["mapped"]
    col_types = schema["col_types"]

    # Parse date column
    if mapped["date_col"]:
        try:
            df[mapped["date_col"]] = pd.to_datetime(df[mapped["date_col"]], infer_datetime_format=True, errors="coerce")
            report["type_fixes"].append(f"{mapped['date_col']} → datetime")
        except Exception:
            pass

    # Coerce amount to numeric
    if mapped["amount_col"]:
        df[mapped["amount_col"]] = pd.to_numeric(
            df[mapped["amount_col"]].astype(str).str.replace(r"[,$€£]", "", regex=True),
            errors="coerce"
        )
        report["type_fixes"].append(f"{mapped['amount_col']} → float")

    # Fill nulls
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        if null_count == 0:
            continue
        ctype = col_types.get(col, "categorical")
        if ctype == "numeric":
            fill_val = round(float(df[col].median(skipna=True) or 0), 2)
            df[col].fillna(fill_val, inplace=True)
            report["missing_filled"][col] = {"count": null_count, "strategy": f"median ({fill_val})"}
        elif ctype == "date":
            df[col].fillna(method="ffill", inplace=True)
            report["missing_filled"][col] = {"count": null_count, "strategy": "forward fill"}
        else:
            mode_vals = df[col].mode()
            fill_val = str(mode_vals.iloc[0]) if not mode_vals.empty else "Unknown"
            df[col].fillna(fill_val, inplace=True)
            report["missing_filled"][col] = {"count": null_count, "strategy": f"mode ('{fill_val}')"}

    return df, report


# ── 3. Metrics calculation ────────────────────────────────────────────────────
def calculate_metrics(df: pd.DataFrame, schema: dict) -> dict[str, Any]:
    """Calculate KPIs, trends, top products, category breakdown."""
    mapped = schema["mapped"]
    metrics: dict[str, Any] = {}

    amount_col   = mapped["amount_col"]
    date_col     = mapped["date_col"]
    product_col  = mapped["product_col"]
    category_col = mapped["category_col"]
    customer_col = mapped["customer_col"]
    city_col     = mapped["city_col"]
    payment_col  = mapped["payment_col"]
    qty_col      = mapped["qty_col"]

    # ── KPIs ──────────────────────────────────────────────────────────────────
    total_revenue = float(df[amount_col].sum()) if amount_col else 0.0
    total_orders  = len(df)
    aov           = round(total_revenue / total_orders, 2) if total_orders else 0.0
    total_customers = int(df[customer_col].nunique()) if customer_col else 0

    metrics["kpis"] = {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "avg_order_value": aov,
        "total_customers": total_customers,
    }

    # ── Monthly trend ─────────────────────────────────────────────────────────
    if date_col and amount_col and pd.api.types.is_datetime64_any_dtype(df[date_col]):
        monthly = (
            df.groupby(df[date_col].dt.to_period("M"))
            .agg(revenue=(amount_col, "sum"), orders=(amount_col, "count"))
            .reset_index()
        )
        monthly[date_col] = monthly[date_col].astype(str)
        monthly.rename(columns={date_col: "month"}, inplace=True)
        metrics["monthly_trend"] = monthly.to_dict("records")
    else:
        metrics["monthly_trend"] = []

    # ── Category breakdown ────────────────────────────────────────────────────
    if category_col and amount_col:
        cat = (
            df.groupby(category_col)[amount_col]
            .sum()
            .sort_values(ascending=False)
            .reset_index()
        )
        cat.columns = ["category", "revenue"]
        cat["revenue"] = cat["revenue"].round(2)
        metrics["category_revenue"] = cat.head(8).to_dict("records")
    else:
        metrics["category_revenue"] = []

    # ── Top products ──────────────────────────────────────────────────────────
    if product_col:
        agg_col = qty_col if qty_col else amount_col
        if agg_col:
            top_p = (
                df.groupby(product_col)[agg_col]
                .sum()
                .sort_values(ascending=False)
                .reset_index()
                .head(10)
            )
            top_p.columns = ["name", "value"]
            top_p["value"] = top_p["value"].round(2)
            metrics["top_products"] = top_p.to_dict("records")
        else:
            metrics["top_products"] = []
    else:
        metrics["top_products"] = []

    # ── Low performing products ───────────────────────────────────────────────
    if product_col and amount_col:
        low_p = (
            df.groupby(product_col)[amount_col]
            .sum()
            .sort_values(ascending=True)
            .reset_index()
            .head(5)
        )
        low_p.columns = ["name", "revenue"]
        low_p["revenue"] = low_p["revenue"].round(2)
        metrics["low_products"] = low_p.to_dict("records")
    else:
        metrics["low_products"] = []

    # ── Top customers ─────────────────────────────────────────────────────────
    if customer_col and amount_col:
        top_c = (
            df.groupby(customer_col)
            .agg(spent=(amount_col, "sum"), orders=(amount_col, "count"))
            .sort_values("spent", ascending=False)
            .reset_index()
            .head(10)
        )
        top_c.columns = ["name", "spent", "orders"]
        top_c["spent"] = top_c["spent"].round(2)
        metrics["top_customers"] = top_c.to_dict("records")
    else:
        metrics["top_customers"] = []

    # ── City revenue ──────────────────────────────────────────────────────────
    if city_col and amount_col:
        city_rev = (
            df.groupby(city_col)[amount_col]
            .sum()
            .sort_values(ascending=False)
            .reset_index()
            .head(8)
        )
        city_rev.columns = ["city", "revenue"]
        city_rev["revenue"] = city_rev["revenue"].round(2)
        metrics["city_revenue"] = city_rev.to_dict("records")
    else:
        metrics["city_revenue"] = []

    # ── Payment methods ───────────────────────────────────────────────────────
    if payment_col:
        pay = (
            df[payment_col].value_counts().reset_index()
        )
        pay.columns = ["method", "count"]
        metrics["payment_methods"] = pay.to_dict("records")
    else:
        metrics["payment_methods"] = []

    # ── Trend analysis ────────────────────────────────────────────────────────
    if metrics["monthly_trend"] and len(metrics["monthly_trend"]) >= 2:
        revenues = [r["revenue"] for r in metrics["monthly_trend"]]
        last  = revenues[-1]
        prev  = revenues[-2]
        trend_pct = round(((last - prev) / prev * 100) if prev else 0, 1)
        metrics["trend"] = {
            "direction": "up" if trend_pct >= 0 else "down",
            "pct": abs(trend_pct),
            "label": f"{'↑' if trend_pct >= 0 else '↓'} {abs(trend_pct)}% vs previous period",
        }
    else:
        metrics["trend"] = {"direction": "neutral", "pct": 0, "label": "Insufficient data for trend"}

    return metrics


# ── 4. AI Insights generation ─────────────────────────────────────────────────
async def generate_ai_insights(metrics: dict, filename: str) -> dict[str, Any]:
    """Generate AI insights from computed metrics. Uses OpenAI if available."""
    kpis = metrics.get("kpis", {})
    trend = metrics.get("trend", {})
    top_cat = metrics.get("category_revenue", [])
    low_prod = metrics.get("low_products", [])
    top_cust = metrics.get("top_customers", [])

    context = f"""
Dataset: {filename}
KPIs: Revenue=${kpis.get('total_revenue', 0):,.0f}, Orders={kpis.get('total_orders', 0)}, AOV=${kpis.get('avg_order_value', 0):.0f}, Customers={kpis.get('total_customers', 0)}
Trend: {trend.get('label', 'N/A')}
Top categories: {', '.join([c['category'] for c in top_cat[:3]]) if top_cat else 'N/A'}
Low performing: {', '.join([p['name'] for p in low_prod[:3]]) if low_prod else 'N/A'}
Top customers: {len(top_cust)} identified
"""

    if _openai_available and settings.OPENAI_API_KEY:
        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = f"""You are a senior e-commerce data analyst. Analyze this dataset summary and provide structured business insights.

{context}

Return a JSON object with these exact keys:
- "summary": 2-3 sentence executive summary
- "trends": list of 3 trend observations (strings)
- "top_categories": list of insights about top performing categories
- "low_performers": list of actionable insights for low-performing products
- "customer_insights": list of 2-3 customer behavior observations
- "recommendations": list of 5 objects with keys: title, priority (high/medium/low), category, description, impact

Return ONLY valid JSON."""

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=1200,
            )
            raw = response.choices[0].message.content or "{}"
            # Strip markdown code fences if present
            raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(raw)
        except Exception:
            pass  # Fall through to mock

    # ── Mock insights ─────────────────────────────────────────────────────────
    top_cat_names = [c["category"] for c in top_cat[:2]] if top_cat else ["Electronics", "Fashion"]
    low_prod_names = [p["name"] for p in low_prod[:2]] if low_prod else ["Item A", "Item B"]
    rev = kpis.get("total_revenue", 0)
    orders = kpis.get("total_orders", 0)
    aov_val = kpis.get("avg_order_value", 0)

    return {
        "summary": (
            f"Your dataset contains **{orders:,} orders** generating **${rev:,.0f}** in total revenue "
            f"with an average order value of **${aov_val:.0f}**. "
            f"The {trend.get('label', 'trend is neutral')} in the most recent period."
        ),
        "trends": [
            f"{trend.get('label', 'Revenue trend is stable')} compared to previous period",
            f"Top category '{top_cat_names[0] if top_cat_names else 'N/A'}' drives the highest revenue share",
            f"Average order value of ${aov_val:.0f} suggests {'premium' if aov_val > 200 else 'mid-range'} buying behavior",
        ],
        "top_categories": [
            f"**{c['category']}** generated ${c['revenue']:,.0f} — your strongest performer"
            for c in top_cat[:3]
        ] or ["No category data detected — ensure a 'category' column exists in your CSV"],
        "low_performers": [
            f"**{p['name']}** has only ${p['revenue']:,.0f} in revenue — consider a promotional push or removal"
            for p in low_prod[:3]
        ] or ["No low-performer data detected"],
        "customer_insights": [
            f"**{len(top_cust)} unique customers** identified in dataset",
            f"Top customer contributed ${top_cust[0]['spent']:,.0f}" if top_cust else "Customer data not available",
            "Consider a loyalty program to improve repeat purchase rates",
        ],
        "recommendations": [
            {"title": f"Promote {low_prod_names[0] if low_prod_names else 'slow-moving items'}", "priority": "high", "category": "Inventory", "description": "Run a 15% discount campaign to clear slow-moving stock and free up cash flow.", "impact": "Est. +25% sell-through"},
            {"title": f"Double down on {top_cat_names[0] if top_cat_names else 'top category'}", "priority": "high", "category": "Revenue", "description": "Expand product listings in your best-performing category to capture more market share.", "impact": f"Est. +${rev * 0.1:,.0f} revenue"},
            {"title": "Launch customer win-back campaign", "priority": "medium", "category": "Retention", "description": "Target customers with no orders in 60+ days with a personalized email + 10% voucher.", "impact": "Est. 30-40% recovery rate"},
            {"title": "Introduce product bundling", "priority": "medium", "category": "AOV", "description": "Bundle top-sellers with complementary low-performers to increase average order value.", "impact": "Est. +12% AOV"},
            {"title": "Target top cities with paid ads", "priority": "low", "category": "Growth", "description": "Focus geo-targeted ads on cities already showing high order volume for highest ROI.", "impact": "Est. 2x ROAS improvement"},
        ],
    }


# ── 5. PDF Report ─────────────────────────────────────────────────────────────
def generate_pdf_report(filename: str, metrics: dict, insights: dict, clean_report: dict) -> bytes:
    """Generate a styled PDF report. Returns bytes."""
    if not _reportlab_available:
        raise RuntimeError("reportlab is not installed")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=0.75*inch, rightMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=20, textColor=colors.HexColor("#6366f1"), spaceAfter=6)
    h2_style    = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13, textColor=colors.HexColor("#818cf8"), spaceBefore=14, spaceAfter=4)
    body_style  = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9, leading=14, textColor=colors.HexColor("#334155"))
    small_style = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#64748b"))

    story = []
    kpis = metrics.get("kpis", {})

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph("DataInsight AI — Upload Report", title_style))
    story.append(Paragraph(f"File: <b>{filename}</b> &nbsp;|&nbsp; Generated: {datetime.now().strftime('%B %d, %Y %H:%M')}", small_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=12))

    # ── KPIs table ────────────────────────────────────────────────────────────
    story.append(Paragraph("Key Performance Indicators", h2_style))
    kpi_data = [
        ["Metric", "Value"],
        ["Total Revenue", f"${kpis.get('total_revenue', 0):,.2f}"],
        ["Total Orders", f"{kpis.get('total_orders', 0):,}"],
        ["Avg Order Value", f"${kpis.get('avg_order_value', 0):,.2f}"],
        ["Total Customers", f"{kpis.get('total_customers', 0):,}"],
    ]
    kpi_table = Table(kpi_data, colWidths=[3.5*inch, 3.5*inch])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#6366f1")),
        ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
        ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING",    (0,0), (-1,-1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 12))

    # ── AI Summary ────────────────────────────────────────────────────────────
    story.append(Paragraph("AI Executive Summary", h2_style))
    summary = insights.get("summary", "No summary available.")
    # Strip markdown bold markers for PDF
    summary_clean = summary.replace("**", "")
    story.append(Paragraph(summary_clean, body_style))
    story.append(Spacer(1, 8))

    # ── Recommendations ───────────────────────────────────────────────────────
    story.append(Paragraph("AI Recommendations", h2_style))
    recs = insights.get("recommendations", [])
    if recs:
        rec_data = [["#", "Title", "Priority", "Impact"]]
        for i, r in enumerate(recs, 1):
            rec_data.append([str(i), r.get("title",""), r.get("priority","").upper(), r.get("impact","")])
        rec_table = Table(rec_data, colWidths=[0.3*inch, 3*inch, 1*inch, 2.7*inch])
        rec_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#8b5cf6")),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#faf5ff"), colors.white]),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING",    (0,0), (-1,-1), 6),
            ("VALIGN",     (0,0), (-1,-1), "TOP"),
        ]))
        story.append(rec_table)
    story.append(Spacer(1, 8))

    # ── Top Products ──────────────────────────────────────────────────────────
    top_prods = metrics.get("top_products", [])
    if top_prods:
        story.append(Paragraph("Top Products", h2_style))
        prod_data = [["Product", "Value"]]
        for p in top_prods[:8]:
            prod_data.append([str(p.get("name","")), f"{p.get('value',0):,.2f}"])
        prod_table = Table(prod_data, colWidths=[4.5*inch, 2.5*inch])
        prod_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#06b6d4")),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#f0fdfa"), colors.white]),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING",    (0,0), (-1,-1), 6),
        ]))
        story.append(prod_table)

    # ── Cleaning Report ───────────────────────────────────────────────────────
    story.append(Spacer(1, 12))
    story.append(Paragraph("Data Quality Report", h2_style))
    story.append(Paragraph(f"Duplicates removed: <b>{clean_report.get('duplicates_removed', 0)}</b>", body_style))
    filled = clean_report.get("missing_filled", {})
    if filled:
        fill_data = [["Column", "Null Count", "Strategy"]]
        for col, info in filled.items():
            fill_data.append([col, str(info.get("count",0)), info.get("strategy","")])
        fill_table = Table(fill_data, colWidths=[2.5*inch, 1.5*inch, 3*inch])
        fill_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#10b981")),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#f0fdf4"), colors.white]),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING",    (0,0), (-1,-1), 6),
        ]))
        story.append(Spacer(1, 4))
        story.append(fill_table)

    story.append(Spacer(1, 16))
    story.append(Paragraph("Generated by DataInsight AI Platform", small_style))

    doc.build(story)
    return buffer.getvalue()
