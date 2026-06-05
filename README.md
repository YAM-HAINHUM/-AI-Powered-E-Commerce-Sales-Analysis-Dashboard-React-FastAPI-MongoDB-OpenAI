# AI-Powered E-Commerce Sales Analysis Dashboard

> Developed an AI-powered E-commerce Sales Analysis Dashboard using React, Python (FastAPI), MongoDB, and SQL, implementing advanced analytics, NLP-based query system, and automated business insights generation.

---

## 🚀 Features

- **Interactive Dashboard** — KPI cards, revenue trends, category breakdowns, top customers
- **SQL Analysis Engine** — 8 predefined queries (window functions, CTEs, running totals) + custom query editor
- **Natural Language to SQL** — Type plain English, get SQL instantly
- **AI Business Insights** — GPT-powered sales analysis, drop analysis, improvement strategies
- **AI Chat Assistant** — Conversational interface for data questions
- **Smart Recommendations** — Churn detection, marketing strategies, inventory alerts
- **Customer Management** — Searchable, paginated customer table with VIP tagging
- **JWT Authentication** — Secure signup/login with persistent sessions
- **Dark/Light Theme** — Full theme toggle with system preference support
- **Export** — CSV export for all data tables and query results

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, ShadCN UI |
| Charts | Recharts |
| Animations | Framer Motion |
| State | Zustand + TanStack Query |
| Backend | Python, FastAPI |
| Database | MongoDB (Motor async) + SQLite (aiosqlite) |
| AI | OpenAI GPT-4o-mini (with mock fallback) |
| Auth | JWT (python-jose + passlib bcrypt) |

---

## 📂 Project Structure

```
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # LandingPage, Dashboard, Analytics, SQL, AI, Chat, Customers
│       ├── components/ # AppLayout, ThemeProvider, UI components
│       ├── hooks/     # useDashboard
│       ├── store/     # Zustand auth store
│       ├── lib/       # axios API client, utils
│       └── types/     # TypeScript interfaces
├── backend/           # FastAPI app
│   └── app/
│       ├── routes/    # auth, dashboard, analytics, customers, sql_query, ai_insights, chat
│       ├── services/  # ai_service, sql_service
│       ├── middleware/ # JWT auth
│       ├── models/    # Pydantic schemas
│       ├── config.py  # Settings
│       └── database.py # MongoDB + SQLite connections
├── database/          # SQLite DB (auto-created)
└── docs/              # API documentation
```

---

## ⚙️ Setup Guide

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env
# Edit .env with your MongoDB URL and OpenAI key

# Seed sample data
python seed_data.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=ecommerce_analytics
SECRET_KEY=your-super-secret-key
OPENAI_API_KEY=sk-your-key-here   # Optional — mock fallback works without it
OPENAI_MODEL=gpt-4o-mini
SQLITE_DB_PATH=./database/ecommerce.db
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/dashboard` | All KPIs + chart data |
| GET | `/api/analytics/monthly-sales` | Monthly trend |
| GET | `/api/analytics/top-customers` | Top customers |
| GET | `/api/analytics/category-revenue` | Category breakdown |
| GET | `/api/analytics/best-selling-products` | Best products |
| GET | `/api/analytics/customer-ranking` | Window function ranking |
| GET | `/api/customers` | Paginated customer list |
| POST | `/api/sql-query` | Execute custom SQL |
| GET | `/api/sql-query/predefined` | List predefined queries |
| POST | `/api/ai-insights/generate` | Generate AI insight |
| POST | `/api/ai-insights/nlp-to-sql` | NLP to SQL conversion |
| GET | `/api/ai-insights/recommendations` | Smart recommendations |
| GET | `/api/ai-insights/summary` | Executive summary |
| POST | `/api/chat` | AI chat assistant |

Full API docs available at `http://localhost:8000/docs` (Swagger UI)

---

## 🌐 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render / Railway |
| Database | MongoDB Atlas |

---

## 📸 Screenshots

- Landing page with glassmorphism hero and animated dashboard preview
- Dark dashboard with KPI cards and Recharts visualizations
- SQL editor with NLP-to-SQL conversion
- AI insights with markdown-rendered GPT analysis
- Chat assistant with conversation history
