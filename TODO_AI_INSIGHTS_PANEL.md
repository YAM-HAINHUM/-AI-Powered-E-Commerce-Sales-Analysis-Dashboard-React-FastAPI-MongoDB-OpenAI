# TODO - AI Insights Panel (non-chat)

- [ ] Backend: add GET `/api/ai-insights` (auto insights)
  - [ ] compute metrics: revenue, orders, avg_order_value, growth vs last month
  - [ ] compute trends: last 7 days vs previous 7 days, current month vs last month
  - [ ] group revenue by city/category/product
  - [ ] anomaly detection: drop >30%, spike >30%
  - [ ] produce `charts` payload (line, bar, pie)
  - [ ] produce `insights`, `alerts`, `recommendations`
- [ ] Frontend: add `frontend/src/components/AIInsightsPanel.jsx`
  - [ ] skeleton loading
  - [ ] auto-refresh 45s
  - [ ] light/dark support
  - [ ] responsive cards
  - [ ] mini charts: line (revenue trend), bar (category), pie (region)
- [ ] Frontend: refactor `frontend/src/pages/AIInsightsPage.tsx`
  - [ ] remove click-to-generate logic
  - [ ] render `AIInsightsPanel`
- [ ] Frontend API: extend `frontend/src/lib/api.ts` with method for GET `/api/ai-insights`
- [ ] Build/test
  - [ ] frontend typecheck/build
  - [ ] backend pytest

