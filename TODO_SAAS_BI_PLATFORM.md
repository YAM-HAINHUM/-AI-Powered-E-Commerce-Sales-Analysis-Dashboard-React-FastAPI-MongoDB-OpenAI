# TODO — Premium AI SaaS Upgrade

> Status: In Progress 🔄

## 1) Sidebar + Routing
- [x] Update `frontend/src/components/layout/SidebarContent.tsx` to add: Health, Goals, Alerts, Trends, Compare
- [x] Update `frontend/src/App.tsx` to add routes for:
  - /app/health
  - /app/goals
  - /app/alerts
  - /app/trends
  - /app/compare
  - /app/settings
  - /app/profile

## 2) Frontend New Components
- [ ] Add `HealthScoreCard`
- [x] Add `GoalTracker`
- [x] Add `AlertsPanel`
- [x] Add `TrendCards`
- [x] Add `ComparisonChart`


## 3) Frontend New Pages
- [ ] Create pages:
  - `frontend/src/pages/Health.jsx` + `frontend/src/pages/HealthDetail.jsx`
  - `frontend/src/pages/Goals.jsx` + `frontend/src/pages/GoalDetail.jsx`
  - `frontend/src/pages/Alerts.jsx` + `frontend/src/pages/AlertDetail.jsx`
  - `frontend/src/pages/Trends.jsx` + `frontend/src/pages/TrendDetail.jsx`
  - `frontend/src/pages/Compare.jsx` + `frontend/src/pages/CompareDetail.jsx`

## 4) Backend SaaS APIs + Services
- [x] Add endpoints:
  - `GET /api/health`
  - `GET /api/goals`
  - `GET /api/alerts`
  - `GET /api/trends`
  - `GET /api/compare`
- [x] Implement rule-based + correlation logic + dummy dataset
- [x] Wire router into `backend/app/main.py`


## 5) Frontend API wiring
- [x] Extend `frontend/src/lib/api.ts` with `saasApi` methods (incl compare)
- [x] Connect new pages to APIs (useMemo/useCallback; minimize rerenders)


## 6) Performance + UX polish
- [ ] Add lazy loading where appropriate
- [ ] Verify glassmorphism styling is consistent
- [ ] Ensure all major features are reachable from sidebar

## 7) Verification
- [ ] Run backend tests
- [ ] Run frontend build / lint
- [ ] Smoke test navigation + pages


