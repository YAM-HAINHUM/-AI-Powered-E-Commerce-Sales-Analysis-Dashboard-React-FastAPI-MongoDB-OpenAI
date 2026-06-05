"""
AI Service - wraps OpenAI for insight generation, NLP-to-SQL, chat, and recommendations.
Falls back to smart mock responses when OPENAI_API_KEY is not set.
"""
from __future__ import annotations
import json
from typing import Optional, List, Any
from datetime import datetime

from app.config import settings
import httpx

# Optional OpenAI import
try:
    from openai import AsyncOpenAI
    _openai_available = True
except ImportError:
    _openai_available = False


def _get_client() -> Optional["AsyncOpenAI"]:
    if _openai_available and settings.OPENAI_API_KEY:
        return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return None


SYSTEM_PROMPT = """You are DataInsight AI, a senior e-commerce data analyst assistant embedded in 
an AI-powered sales analytics dashboard. You provide concise, actionable insights from sales data.
Always respond in a professional yet friendly tone. Format your responses using markdown when helpful."""

MOCK_INSIGHTS = {
    "general": """## 📊 Sales Performance Overview

**Revenue Highlights:**
- Total revenue is tracking **+18.3%** above last quarter's baseline.
- The **Electronics** category drives ~42% of all revenue — strong dependency worth monitoring.
- **Top 3 customers** account for 28% of total spend; consider a loyalty program.

**Operational Signals:**
- Average order value has increased to **$284** — customers are buying premium products.
- Weekend orders spike 35% higher than weekdays; ensure inventory & support staffing aligns.

**Quick Wins:**
1. 🎯 Launch targeted email campaigns for customers with 1 order (convert to repeat buyers).
2. 📦 Bundle slow-moving Clothing SKUs with high-demand Electronics accessories.
3. 🔔 Set up restock alerts for the top-5 selling products to avoid stockouts.""",

    "drop": """## 🔻 Revenue Drop Analysis

**Likely Root Causes:**
1. **Seasonal Pattern** — This month typically sees a 12-15% dip based on historical data.
2. **Cart Abandonment** — Checkout abandonment may have increased due to shipping cost changes.
3. **Competitor Activity** — Price comparisons on Electronics suggest increased competitive pressure.

**Recommended Actions:**
- Introduce a limited-time free-shipping threshold to recover abandoned carts.
- Run a flash sale on the top-3 churned customer segments.
- Review and optimize product listing pages for SEO to restore organic traffic.""",

    "improvement": """## 🚀 Top Improvement Strategies

**Growth Levers:**
1. **Upsell at Checkout** — Add "Frequently Bought Together" recommendations (est. +8% AOV).
2. **Email Automation** — Set up 3-email win-back series for 90-day inactive customers.
3. **Category Expansion** — Home & Garden shows 67% YoY growth; invest in wider catalog.

**Retention Focus:**
- Identify VIP customers (top 10% by spend) and offer early access to new products.
- Implement a points-based loyalty program — industry data shows 40% higher LTV.

**Analytics Gaps:**
- Enable real-time inventory tracking to prevent revenue loss from stockouts.
- Set up cohort analysis to track retention curves by acquisition month.""",

    "summary": """## 📋 Executive Dashboard Summary

**Period:** Last 30 Days | **Generated:** {date}

| Metric | Value | Change |
|--------|-------|--------|
| Total Revenue | $48,320 | +18.3% ↑ |
| Orders | 342 | +12.1% ↑ |
| Avg Order Value | $284 | +5.6% ↑ |
| New Customers | 87 | +22.0% ↑ |
| Repeat Rate | 64% | +3.2% ↑ |

**Key Takeaways:**
- Strong growth momentum across all KPIs.
- Electronics and Books are top-performing categories.
- Customer acquisition costs are decreasing while LTV grows — a healthy signal.
- 3 customers flagged as churn risk (no orders in 60+ days).""".format(date=datetime.now().strftime("%B %d, %Y")),
}

MOCK_RECOMMENDATIONS = [
    {
        "title": "Launch Win-Back Campaign",
        "priority": "high",
        "category": "Retention",
        "description": "15 customers haven't ordered in 60+ days. A personalized email with a 10% discount code could recover ~40% of them.",
        "estimated_impact": "+$2,400 revenue",
    },
    {
        "title": "Bundle Electronics with Accessories",
        "priority": "high",
        "category": "Revenue",
        "description": "Top-selling phones are rarely purchased with cases or earbuds. A bundle discount of 8% could increase AOV significantly.",
        "estimated_impact": "+12% AOV",
    },
    {
        "title": "Flash Sale on Clothing Category",
        "priority": "medium",
        "category": "Inventory",
        "description": "Clothing inventory is 3x higher than average sell-through rate. A 3-day flash sale will clear stock and fund new inventory.",
        "estimated_impact": "Clear 40% excess stock",
    },
    {
        "title": "Introduce Loyalty Points Program",
        "priority": "medium",
        "category": "Retention",
        "description": "Customers with 3+ orders have 2.8x higher LTV. A simple points system encourages repeat purchases.",
        "estimated_impact": "+35% repeat rate",
    },
    {
        "title": "Optimize Mobile Checkout",
        "priority": "low",
        "category": "Conversion",
        "description": "Mobile users have a 23% higher cart abandonment rate. Streamlining the checkout to 2 steps could recover significant revenue.",
        "estimated_impact": "+8% conversion rate",
    },
]


async def generate_insight(insight_type: str, context: Optional[str] = None) -> str:
    """Generate AI business insight. Uses OpenAI if available, else returns mock."""
    client = _get_client()

    if client:
        prompt = f"Analyze this e-commerce data and provide {insight_type} insights:\n\n{context or 'Use typical e-commerce metrics.'}"
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=800,
        )
        return response.choices[0].message.content or ""

    # Fallback mock
    return MOCK_INSIGHTS.get(insight_type, MOCK_INSIGHTS["general"])


async def groq_query(query: str) -> Optional[str]:
    """Query a generic GROQ-compatible endpoint to retrieve humanized content.

    Expects `settings.GROQ_API_URL` to be the full endpoint URL and
    `settings.GROQ_API_KEY` to be the Bearer token.
    Returns the text result if available, otherwise None.
    """
    if not settings.GROQ_API_KEY or not settings.GROQ_API_URL:
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {"query": query}
            resp = await client.post(settings.GROQ_API_URL, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                # Try common fields
                if isinstance(data, dict):
                    return data.get("result") or data.get("text") or data.get("message") or json.dumps(data)
                return str(data)
    except Exception:
        return None



async def natural_language_to_sql(question: str) -> str:
    """Convert a natural language question to a SQL query."""
    client = _get_client()

    schema = """
Tables:
- customers(customer_id, name, city, signup_date)
- orders(order_id, customer_id, order_date, amount)
- products(product_id, product_name, category, price)
- order_items(order_id, product_id, quantity)
"""

    if client:
        prompt = f"""Given this SQLite schema:{schema}
Convert this question to a valid SQLite SELECT query. Return ONLY the SQL query, no explanation.
Question: {question}"""
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a SQL expert. Return only the SQL query, nothing else."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
            max_tokens=300,
        )
        return response.choices[0].message.content or ""

    # Fallback mock translations
    q = question.lower()
    if "top customer" in q or "best customer" in q:
        return """SELECT c.name, c.city, ROUND(SUM(o.amount), 2) AS total_spent
FROM customers c JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 10"""
    elif "revenue" in q and "month" in q:
        return """SELECT strftime('%Y-%m', order_date) AS month, ROUND(SUM(amount), 2) AS revenue
FROM orders GROUP BY month ORDER BY month ASC"""
    elif "product" in q and ("best" in q or "top" in q):
        return """SELECT p.product_name, p.category, SUM(oi.quantity) AS units_sold
FROM products p JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id ORDER BY units_sold DESC LIMIT 10"""
    elif "category" in q:
        return """SELECT p.category, ROUND(SUM(oi.quantity * p.price), 2) AS revenue
FROM products p JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.category ORDER BY revenue DESC"""
    else:
        return """SELECT c.name, COUNT(o.order_id) AS orders, ROUND(SUM(o.amount), 2) AS total_spent
FROM customers c JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 10"""


async def chat_with_data(message: str, history: list[dict]) -> str:
    """Chat assistant that answers questions about e-commerce data."""
    client = _get_client()

    if client:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for h in history[-6:]:  # Keep last 6 messages for context
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        return response.choices[0].message.content or ""

        # Try GROQ-based humanized fallback if available
        try:
            if not _get_client() and settings.GROQ_API_KEY and settings.GROQ_API_URL:
                # Ask GROQ for a human-friendly, structured reply that includes summary, SQL, chart suggestion, and actions
                groq_prompt = (
                    "Please produce a clear, human-friendly, multi-part response to this user question. "
                    "Include: 1) Short summary (2-3 sentences); 2) A ready-to-run SQL query labeled 'SQL' to answer the question; "
                    "3) A recommended chart type and a one-line reason; 4) 3 actionable recommendations; 5) 3 suggested follow-up questions. "
                    f"User question: {message}"
                )
                groq_resp = await groq_query(groq_prompt)
                if groq_resp:
                    return groq_resp
        except Exception:
            # best-effort: ignore and continue to built-in mock
            pass
        # Structured mock fallback for richer replies when neither OpenAI nor GROQ are configured
        structured = _structured_mock_for_question(message)
        if structured:
            return structured

        # Mock chat responses
    m = message.lower()
    if "revenue" in m:
        return "📈 Based on current data, total revenue stands at **$48,320** — up 18.3% from last month. The highest revenue day was last Friday with $3,240 in sales."
    elif "customer" in m:
        return "👥 You have **342 active customers** this month. Top spender is Alice Johnson with $2,840 in purchases. 15 customers are flagged as churn risk."
    elif "product" in m or "selling" in m:
        return "🏆 Your **best-selling product** is the 'Wireless Earbuds Pro' with 48 units sold. Electronics accounts for 42% of all revenue this month."
    elif "recommend" in m or "suggest" in m:
        return "💡 My top recommendation: Launch a **win-back email campaign** for the 15 inactive customers. Based on historical data, a 10% discount code recovers ~40% of churned customers."
    elif "hello" in m or "hi" in m:
        return "👋 Hello! I'm **DataInsight AI**, your e-commerce analytics assistant. Ask me anything about your sales data — revenue trends, customer behavior, product performance, or get strategic recommendations!"
    else:
        return f"I analyzed your question about *'{message}'*. Based on your current sales data, I'd suggest reviewing the monthly trends dashboard for detailed insights. Would you like me to generate a specific analysis?"


async def get_smart_recommendations() -> list[dict]:
    """Return smart business recommendations."""
    return MOCK_RECOMMENDATIONS


def format_query_results_to_text(question: str, sql_used: str, rows: List[List[Any]], columns: List[str]) -> str:
    """
    Intelligently format SQL query results into a human-friendly text response.
    Detects aggregates (total, sum, count) and formats appropriately.
    """
    q = question.lower()
    
    # Aggregate result (single row, single or few columns)
    if len(rows) == 1 and len(columns) <= 2:
        row_data = rows[0]
        
        # Total revenue / sum pattern
        if any(kw in q for kw in ["total revenue", "total sales", "sum", "total amount"]):
            value = row_data[0] if row_data else 0
            if isinstance(value, (int, float)):
                formatted_val = f"${value:,.2f}" if value > 100 else f"{value:.2f}"
                return f"### 📊 Answer:\nTotal revenue is **{formatted_val}**\n\n### 🔍 Insights:\n- This represents cumulative sales across all orders and products.\n- Use this baseline to track growth month-over-month or identify seasonal patterns."
        
        # Single metric (count, avg, etc.)
        if len(columns) == 1:
            return f"### 📊 Answer:\n{columns[0]}: **{row_data[0]}**"
    
    # Multi-row results - format as a bulleted list
    if len(rows) > 1 and len(columns) == 2:
        lines = [f"### 📊 Answer:\n"]
        col1, col2 = columns[0], columns[1]
        
        # Detect if col2 is numeric to format as currency/decimal
        is_numeric = isinstance(rows[0][1], (int, float))
        
        for row in rows[:10]:  # Show top 10
            val1, val2 = row[0], row[1]
            if is_numeric and val2 > 100:
                val2_fmt = f"${val2:,.2f}"
            elif is_numeric:
                val2_fmt = f"{val2:.2f}"
            else:
                val2_fmt = str(val2)
            lines.append(f"- **{val1}**: {val2_fmt}")
        
        return "\n".join(lines)
    
    # Default: just show results table
    lines = ["### 📊 Query Results:\n| " + " | ".join(columns) + " |"]
    lines.append("| " + " | ".join(["---"] * len(columns)) + " |")
    for row in rows[:10]:
        lines.append("| " + " | ".join(str(v) for v in row) + " |")
    return "\n".join(lines)


def _structured_mock_for_question(question: str) -> Optional[str]:
    q = question.lower()
    if "compare sales by category" in q or ("sales" in q and "category" in q) or ("compare" in q and "category" in q):
        sql = (
            "SELECT p.category, ROUND(SUM(oi.quantity * p.price), 2) AS revenue, "
            "SUM(oi.quantity) AS units_sold "
            "FROM products p JOIN order_items oi ON p.product_id = oi.product_id "
            "GROUP BY p.category ORDER BY revenue DESC;"
        )
        summary = (
            "Summary:\n- Electronics and Books typically lead revenue. "
            "Provide category-level revenue and units sold to identify top performers and underperformers.\n"
        )
        chart = "Recommended chart: Bar chart (category vs revenue) — shows comparison clearly."
        actions = (
            "Actionable recommendations:\n"
            "1. Promote underperforming categories with targeted discounts.\n"
            "2. Bundle high-margin items from top categories with lower-performing SKUs.\n"
            "3. Reallocate marketing spend to top 2 categories while testing a 10% lift in the 3rd category.\n"
        )
        followups = (
            "Suggested follow-ups:\n"
            "- Show month-over-month revenue by category.\n"
            "- Which SKUs contribute most within the top category?\n"
            "- What is the average order value per category?\n"
        )

        parts = [
            "## 📊 Compare Sales by Category",
            "### 1) Short Summary",
            summary,
            "### 2) SQL",
            f"```sql\n{sql}\n```",
            "### 3) Chart Recommendation",
            chart,
            "### 4) Actionable Recommendations",
            actions,
            "### 5) Suggested Follow-ups",
            followups,
        ]

        return "\n\n".join(parts)

    return None
