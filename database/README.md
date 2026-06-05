# Database Layer

This project uses **two databases** in tandem:

| Database | Purpose |
|----------|---------|
| MongoDB | Document store for raw data, AI insights, query logs, and user accounts |
| SQLite | SQL analysis engine for running complex analytical queries |

## MongoDB Collections

| Collection | Description |
|------------|-------------|
| `users` | Registered user accounts |
| `customers` | Customer documents (mirrored from SQLite) |
| `orders` | Order documents |
| `products` | Product catalog |
| `ai_insights` | AI-generated business insights |
| `query_logs` | History of SQL queries executed |

## SQLite Schema

```sql
customers(customer_id, name, city, signup_date)
orders(order_id, customer_id, order_date, amount)
products(product_id, product_name, category, price)
order_items(order_id, product_id, quantity)
```

## Seed Data

Run `python backend/seed_data.py` to populate both databases with 50 customers,
20 products, and ~200 orders spanning 12 months.
