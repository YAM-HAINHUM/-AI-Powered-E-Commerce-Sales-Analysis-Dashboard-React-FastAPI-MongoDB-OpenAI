# API Documentation

Base URL: `http://localhost:8000`

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST `/api/auth/signup`
Register a new user.

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "...", "email": "john@example.com", "username": "johndoe" }
}
```

---

### POST `/api/auth/login`
Login with email and password.

**Body:**
```json
{ "email": "john@example.com", "password": "securepassword" }
```

---

## Dashboard

### GET `/api/dashboard`
Returns all KPIs, monthly trends, top customers, and category data in one call.

**Response:**
```json
{
  "kpis": { "total_revenue": 48320.0, "total_orders": 342, ... },
  "monthly_trend": [...],
  "top_customers": [...],
  "category_revenue": [...],
  "top_products": [...]
}
```

---

## Customers

### GET `/api/customers?page=1&limit=20&search=alice`
Paginated customer list with optional search.

### GET `/api/customers/{customer_id}`
Get a single customer with their order history.

---

## Analytics

### GET `/api/analytics/monthly-sales`
### GET `/api/analytics/top-customers`
### GET `/api/analytics/category-revenue`
### GET `/api/analytics/best-selling-products`
### GET `/api/analytics/customer-ranking`

All return `{ columns, rows, row_count, execution_time_ms, query_used }`.

---

## SQL Query Engine

### POST `/api/sql-query`
Execute a custom SQL query (SELECT/WITH only).

**Body:**
```json
{ "query": "SELECT * FROM customers LIMIT 5" }
```

### GET `/api/sql-query/predefined`
List all predefined queries.

### GET `/api/sql-query/predefined/{query_name}`
Execute a named predefined query. Available names:
- `total_revenue`
- `top_customers`
- `monthly_sales_trend`
- `best_selling_products`
- `customer_ranking`
- `repeat_customers`
- `running_total`
- `category_revenue`

---

## AI Insights

### POST `/api/ai-insights/generate`
Generate an AI business insight.

**Body:**
```json
{ "insight_type": "general" }
```
Types: `general`, `drop`, `improvement`, `summary`

### POST `/api/ai-insights/nlp-to-sql`
Convert natural language to SQL.

**Body:**
```json
{ "question": "Show me top customers by revenue" }
```

### GET `/api/ai-insights/recommendations`
Get smart business recommendations.

### GET `/api/ai-insights/summary`
Generate an executive summary.

---

## Chat

### POST `/api/chat`
Chat with the AI data assistant.

**Body:**
```json
{
  "message": "What is my total revenue this month?",
  "conversation_history": []
}
```
