<<<<<<< HEAD
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
=======
# -AI-Powered-E-Commerce-Analytics-Dashboard-SaaS-Level-
A full-stack analytics platform built with React, Tailwind, Python &amp; MongoDB 📊 featuring AI insights 🤖, forecasting 📈, KPI tracking, anomaly detection 🚨, smart alerts, goals 🎯, profile &amp; settings ⚙️, real-time dashboards, data visualization, reports 📤, integrations 🔌, and modern SaaS UI 🌙☀️ for data-driven decisions.


🚀 AI-Powered E-Commerce Analytics Dashboard (Enterprise SaaS-Level Platform)

This project is a full-stack, enterprise-grade AI-powered analytics and business intelligence platform engineered to transform raw e-commerce data into actionable insights using modern data engineering, scalable backend architecture, and intelligent AI-driven decision systems.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 PRODUCT VISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The platform is designed as a unified analytics ecosystem where users can seamlessly monitor KPIs, detect anomalies, generate forecasts, and receive AI-powered recommendations in real time.

It bridges the gap between:
➡️ Data Collection → Data Processing → Insight Generation → Decision Making

The system replicates real-world SaaS platforms like advanced BI tools by combining:

* Data visualization
* AI/ML-based inference
* User personalization
* Scalable architecture

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ TECH STACK & JUSTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️ Frontend: React.js + Tailwind CSS

* Component-based architecture ensures reusability and scalability
* Tailwind enables rapid UI development with consistent design tokens
* Virtual DOM improves rendering performance

📊 Visualization Layer: Recharts / Charting Libraries

* Used for rendering dynamic, responsive charts
* Supports composable chart components (Line, Bar, Pie, Area)

⚡ Backend: Python (FastAPI / Flask)

* FastAPI provides asynchronous request handling for high performance
* RESTful API architecture ensures modular communication
* Python enables easy integration with ML/AI models

🗄️ Database: MongoDB (NoSQL)

* Flexible schema design for dynamic datasets
* Efficient handling of semi-structured and large-scale data
* Aggregation pipelines for complex analytics queries

🤖 AI Layer:

* Rule-based + AI inference hybrid system
* Can integrate LLM APIs (Groq/OpenAI-like)
* Used for:

  * Insight generation
  * Forecasting
  * Recommendation systems

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ SYSTEM ARCHITECTURE (LAYERED DESIGN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🧩 Presentation Layer (Frontend)

   * Dashboard UI rendering
   * State management (Context API / Hooks)
   * User interaction handling

2. 🔌 API Layer (Backend Services)

   * REST endpoints
   * Business logic execution
   * Authentication & authorization

3. 📊 Data Processing Layer

   * Data cleaning & transformation
   * Aggregation pipelines
   * KPI computation

4. 🤖 AI Intelligence Layer

   * Predictive analytics
   * Anomaly detection algorithms
   * Insight generation engine

5. 🗃️ Data Storage Layer

   * MongoDB collections:

     * Users
     * Orders
     * Products
     * Analytics logs
     * Goals & alerts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CORE MODULES & FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 1. ADVANCED ANALYTICS DASHBOARD

* Real-time KPI cards (Revenue, Orders, Customers, Growth %)
* Time-series trend analysis
* Multi-dimensional filtering
* Drill-down capabilities

🤖 2. AI INSIGHTS ENGINE

* Automated insight generation
* Context-aware recommendations
* Pattern recognition across datasets
* Natural language-based explanations

📉 3. PREDICTIVE ANALYTICS

* Time-series forecasting (future revenue trends)
* Demand prediction
* Growth projections

🚨 4. ANOMALY DETECTION SYSTEM

* Statistical threshold detection
* Behavioral anomaly tracking
* Alerts for unusual spikes/drops

🔔 5. SMART ALERTING SYSTEM

* Event-driven notifications
* Configurable thresholds
* Multi-channel alerts (UI + Email-ready architecture)

🎯 6. GOAL MANAGEMENT SYSTEM

* KPI-based goal creation
* Progress tracking with visual indicators
* AI-driven suggestions to achieve targets

👤 7. ADVANCED PROFILE SYSTEM

* User activity analytics
* AI usage metrics
* Role-based access control (RBAC)
* Team collaboration & management

⚙️ 8. SETTINGS ENGINE (CONTROL CENTER)

* AI configuration (frequency, model tuning)
* Notification preferences
* Theme customization (Dark/Light/System)
* Data formatting & localization

🔌 9. INTEGRATION LAYER

* External APIs (Shopify, Google Analytics – mock-ready)
* API key management
* Scalable plugin architecture

📤 10. REPORTING & EXPORT MODULE

* Export data to PDF/Excel
* Scheduled report generation
* Shareable analytics snapshots

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 UI/UX ENGINEERING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* Modern SaaS UI (inspired by Stripe, Notion, dashboards)
* Glassmorphism + gradient aesthetics
* Responsive design (mobile + desktop)
* Component-driven design system
* Accessibility and usability optimization

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ PERFORMANCE OPTIMIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* Lazy loading & code splitting
* Memoization (React.memo, useMemo)
* Efficient API batching
* Optimized MongoDB queries & indexing
* Minimal re-render strategies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SECURITY & AUTHENTICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* JWT-based authentication (extendable)
* Role-based authorization (RBAC)
* Secure API endpoints
* Session and device management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 SCALABILITY & EXTENSIBILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* Modular architecture
* Microservice-ready backend structure
* Easily pluggable AI modules
* Scalable database design

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 USE CASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* E-commerce analytics platforms
* Business intelligence dashboards
* Startup data monitoring tools
* AI-driven decision systems

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 FINAL OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To build a scalable, intelligent, and production-ready SaaS analytics platform that demonstrates:

✅ Full-stack engineering excellence
✅ Real-time data processing
✅ AI-powered insights & forecasting
✅ Modern UI/UX design principles
✅ Enterprise-level architecture

This project serves as a complete showcase of advanced skills in:

* Data Analytics
* Full-Stack Development
* AI Integration
* System Design

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A powerful platform that converts complex data into clear insights, enabling businesses to make faster, smarter, and more strategic decisions.
>>>>>>> 128da15132c0be5c23d0937ce1933745e5cbe1d2
