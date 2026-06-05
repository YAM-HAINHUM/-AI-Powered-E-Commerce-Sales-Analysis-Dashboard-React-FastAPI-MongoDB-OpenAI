"""
SQL & Chart Generator Engine Service.
Translates Natural Language to SQL, performs query validation for safety,
executes queries against SQLite (both core and uploaded files),
cahces results, and selects appropriate charts.
"""
from __future__ import annotations
import re
import time
import sqlite3
import pandas as pd
from typing import Optional, List, Dict, Any, Tuple
from app.config import settings
from app.services.ai_service import _get_client
from app.database import get_sqlite_connection

# In-memory query cache: {query_string: (expiry_timestamp, result_dict)}
_query_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 120

# Core tables in SQLite
CORE_TABLES = {"customers", "products", "orders", "order_items"}

def clean_query_cache():
    """Remove expired entries from the query cache."""
    now = time.monotonic()
    expired = [k for k, (exp, _) in _query_cache.items() if now > exp]
    for k in expired:
        _query_cache.pop(k, None)

async def get_sqlite_tables() -> List[str]:
    """Retrieve all table names currently in the SQLite database."""
    async with await get_sqlite_connection() as conn:
        async with conn.execute("SELECT name FROM sqlite_master WHERE type='table'") as cursor:
            rows = await cursor.fetchall()
            return [row[0] for row in rows]

def validate_query_safety(sql: str, allowed_tables: List[str]) -> bool:
    """
    Validate that a SQL query is read-only, references only allowed tables,
    and is safe from stacked-query injections.
    """
    normalized = sql.strip().upper()
    
    # Rule 1: Must be a read-only query starting with SELECT or WITH
    if not (normalized.startswith("SELECT") or normalized.startswith("WITH")):
        raise ValueError("Security violation: Only SELECT or WITH queries are allowed.")
        
    # Rule 2: PreventStacked queries (no semicolons allowed except at the absolute end)
    # Remove final semicolon if present
    clean_sql = sql.strip()
    if clean_sql.endswith(";"):
        clean_sql = clean_sql[:-1]
    if ";" in clean_sql:
        raise ValueError("Security violation: Multi-statement execution via semicolons is blocked.")
        
    # Rule 3: Mutation keyword block list
    blocked_keywords = [
        "DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", 
        "REPLACE", "TRUNCATE", "GRANT", "REVOKE", "PRAGMA", "ATTACH"
    ]
    for kw in blocked_keywords:
        # Match word boundaries to prevent false positives (like 'created_at' matching 'create')
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, normalized):
            raise ValueError(f"Security violation: Blocked statement keyword '{kw}' detected.")
            
    # Rule 4: Table access verification.
    # Find all table-like tokens after FROM or JOIN
    # Extract words that are immediately after FROM or JOIN, ignoring subqueries in parentheses
    from_join_pattern = r"\b(?:FROM|JOIN)\s+([a-zA-Z0-9_]+)"
    referenced_tables = re.findall(from_join_pattern, normalized)
    
    allowed_set = set(allowed_tables)
    for table in referenced_tables:
        table_lower = table.lower()
        # CTEs might be defined in the query. Let's extract CTE definitions to avoid false positives.
        cte_pattern = r"\b([a-zA-Z0-9_]+)\s+AS\s*\("
        ctes = [cte.lower() for cte in re.findall(cte_pattern, normalized)]
        
        if table_lower not in allowed_set and table_lower not in ctes:
            raise ValueError(f"Security violation: Table '{table}' is not accessible in this context.")
            
    return True

async def register_uploaded_file(session_id: str, filename: str, df: pd.DataFrame) -> Dict[str, Any]:
    """
    Register a Pandas DataFrame as a temporary session table in SQLite.
    Normalizes columns to be SQL-safe.
    """
    # Create safe table name
    table_name = f"uploaded_file_{session_id.replace('-', '_')}"
    
    # Normalize columns: lower, underscores, remove non-alphanumeric
    cleaned_cols = []
    for col in df.columns:
        clean_name = re.sub(r"[^a-zA-Z0-9_]", "", str(col).strip().lower().replace(" ", "_"))
        if not clean_name:
            clean_name = f"column_{len(cleaned_cols)}"
        # Handle duplicates
        orig_name = clean_name
        counter = 1
        while clean_name in cleaned_cols:
            clean_name = f"{orig_name}_{counter}"
            counter += 1
        cleaned_cols.append(clean_name)
        
    df.columns = cleaned_cols
    
    # Sync operation to write data into sqlite
    # We open a direct sqlite3 connection for the pandas export to run safely
    def _write_df():
        conn = sqlite3.connect(settings.SQLITE_DB_PATH)
        try:
            df.to_sql(name=table_name, con=conn, if_exists="replace", index=False)
        finally:
            conn.close()
            
    # Run in threadpool since it's blocking
    import asyncio
    await asyncio.to_thread(_write_df)
    
    return {
        "table_name": table_name,
        "columns": cleaned_cols,
        "row_count": len(df)
    }

async def drop_uploaded_file_table(session_id: str):
    """Clean up custom table for a chat session from SQLite."""
    table_name = f"uploaded_file_{session_id.replace('-', '_')}"
    async with await get_sqlite_connection() as conn:
        await conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        await conn.commit()

async def generate_sql_and_chart_type(
    question: str, 
    session_id: str, 
    custom_table_info: Optional[Dict[str, Any]] = None
) -> Tuple[str, str]:
    """
    Use LLM to convert user query to SQL and select a recommended chart type.
    Returns: (sql_query, chart_type)
    """
    client = _get_client()
    
    # Construct SQLite schema representation
    core_schema = """
Core Tables:
- customers(customer_id TEXT, name TEXT, city TEXT, signup_date TEXT)
- orders(order_id TEXT, customer_id TEXT, order_date TEXT, amount REAL)
- products(product_id TEXT, product_name TEXT, category TEXT, price REAL)
- order_items(order_id TEXT, product_id TEXT, quantity INTEGER)
"""
    custom_schema = ""
    if custom_table_info:
        table_name = custom_table_info["table_name"]
        cols = ", ".join([f"{c} TEXT/REAL" for c in custom_table_info["columns"]])
        custom_schema = f"\nUploaded Custom Table:\n- {table_name}({cols})\n"
        
    schema_context = core_schema + custom_schema
    
    system_prompt = f"""You are an expert SQL analyst. Convert the natural language question to a SQLite SELECT query.
Also, decide on the best chart type to visualize this data.
Choose exactly one of: 'line', 'bar', 'pie', 'scatter', or 'none'.

Database schema context:
{schema_context}

RULES:
1. Return your response in strict JSON format with exactly two keys: "sql" and "chart_type".
2. Only write a SELECT query. Do not use semicolons.
3. For custom tables, use the exact table name: {custom_table_info['table_name'] if custom_table_info else ''}.
4. Return ONLY valid JSON.
"""

    if client:
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Question: {question}"}
                ],
                temperature=0,
                response_format={"type": "json_object"}
            )
            raw_res = response.choices[0].message.content or ""
            import json
            parsed = json.loads(raw_res)
            return parsed.get("sql", "").strip(), parsed.get("chart_type", "none").lower()
        except Exception as e:
            print(f"⚠️ OpenAI SQL generation error: {e}")
            
    # Mock fallback translation if API key is not set or errors out
    q = question.lower()
    sql = ""
    chart_type = "none"
    
    # Handle custom uploaded file query mock
    if custom_table_info:
        table_name = custom_table_info["table_name"]
        cols = custom_table_info["columns"]
        # Find numeric column
        numeric_cols = cols[1:] # standard guess
        cat_col = cols[0]
        sql = f"SELECT {cat_col}, SUM({numeric_cols[0] if numeric_cols else cols[0]}) AS value FROM {table_name} GROUP BY {cat_col} LIMIT 15"
        chart_type = "bar"
    # Core tables fallback
    elif re.search(r"\b(total\s+revenue|total\s+sales|what\s+is\s+total\s+revenue|sum\s*\(amount\)|total\s+revenue\b)", q):
        # Direct total revenue request -> return a single-number aggregate
        sql = "SELECT ROUND(SUM(amount), 2) AS total_revenue FROM orders"
        chart_type = "none"
    elif "revenue" in q and "month" in q:
        sql = "SELECT strftime('%Y-%m', order_date) AS month, ROUND(SUM(amount), 2) AS revenue FROM orders GROUP BY month ORDER BY month ASC"
        chart_type = "line"
    elif "top customer" in q or "best customer" in q:
        sql = "SELECT c.name, ROUND(SUM(o.amount), 2) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 10"
        chart_type = "bar"
    elif "product" in q and ("best" in q or "top" in q):
        sql = "SELECT p.product_name, SUM(oi.quantity) AS units_sold FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id ORDER BY units_sold DESC LIMIT 10"
        chart_type = "bar"
    elif "category" in q:
        sql = "SELECT p.category, ROUND(SUM(oi.quantity * p.price), 2) AS revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.category ORDER BY revenue DESC"
        chart_type = "pie"
    else:
        # Default fallback
        sql = "SELECT order_date, amount FROM orders ORDER BY order_date DESC LIMIT 10"
        chart_type = "line"
        
    return sql, chart_type

def auto_detect_chart_type(columns: List[str], rows: List[List[Any]]) -> str:
    """Rule-based safety fallback to select chart type based on returned data shapes."""
    if not rows or len(columns) < 2:
        return "none"
        
    # Check if we have two numeric columns (ideal for Scatter)
    # Check column types based on first row
    first_row = rows[0]
    num_numeric = sum(1 for v in first_row if isinstance(v, (int, float)))
    
    # If 2 numeric fields + 1 category field, or just 2 numeric fields
    if num_numeric >= 2:
        return "scatter"
        
    # Let's inspect column names
    col_names_lower = [c.lower() for c in columns]
    has_date = any(any(x in col for x in ["date", "month", "year", "time", "day"]) for col in col_names_lower)
    
    if has_date:
        return "line"
        
    # Check category sizes. Pie is best for small proportions.
    if len(rows) <= 8:
        return "pie"
        
    return "bar"

async def execute_analysis_query(
    sql: str, 
    session_id: str, 
    custom_table_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Validate, cache check, execute the SQL query, and return structured JSON."""
    clean_query_cache()
    
    # 1. Setup allowed tables whitelist
    allowed_tables = list(CORE_TABLES)
    if custom_table_info:
        allowed_tables.append(custom_table_info["table_name"])
        
    # 2. Safety Validation
    validate_query_safety(sql, allowed_tables)
    
    # 3. Cache lookup
    cache_key = f"{session_id}:{sql.strip()}"
    if cache_key in _query_cache:
        expiry, result = _query_cache[cache_key]
        if time.monotonic() < expiry:
            return result
            
    # 4. Execute query
    start_time = time.monotonic()
    async with await get_sqlite_connection() as conn:
        conn.row_factory = sqlite3.Row
        try:
            async with conn.execute(sql) as cursor:
                rows = await cursor.fetchall()
                columns = [desc[0] for desc in cursor.description or []]
        except Exception as e:
            raise ValueError(f"SQLite execution failed: {str(e)}")
            
    elapsed_ms = (time.monotonic() - start_time) * 1000
    
    # Convert sqlite rows to pure JSON-compatible list of lists
    formatted_rows = [list(row) for row in rows]
    
    # Format the data for charts: list of objects like [{"month": "2026-01", "revenue": 1000}]
    chart_data = []
    for r in formatted_rows:
        obj = {}
        for idx, col in enumerate(columns):
            obj[col] = r[idx]
        chart_data.append(obj)
        
    result = {
        "columns": columns,
        "rows": formatted_rows,
        "chart_data": chart_data,
        "row_count": len(formatted_rows),
        "execution_time_ms": round(elapsed_ms, 2),
        "sql_used": sql.strip()
    }
    
    # Cache result
    _query_cache[cache_key] = (time.monotonic() + CACHE_TTL_SECONDS, result)
    
    return result
