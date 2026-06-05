# User Data Tracking and Storage System

A comprehensive user lifecycle tracking system for the AI-Powered E-Commerce Sales Analysis Dashboard.

## Architecture

### Backend (FastAPI + MongoDB)

#### Collections

1. **users** - Extended user profile with:
   - `personal_info`: name, email, phone, profile_picture, role, organization
   - `account_settings`: theme, language, notifications, timezone
   - `security`: last_login, login_history, two_fa_enabled, devices
   - `subscription`: plan, usage_limits, billing_info

2. **user_activity_logs** - Tracks every user action:
   - action: login/logout/upload/view_dashboard/export_report/view_chart/apply_filter/generate_ai/download
   - module: dashboard/profile/analytics/upload/ai/settings
   - ip_address, device, metadata

3. **data_uploads** - Data upload tracking:
   - file_name, file_type, file_size
   - columns_detected, rows_count
   - data_summary, ai_insights_generated

4. **dashboard_tracking** - Dashboard visualization interactions:
   - dashboard_id, visualizations array
   - total_time_spent, most_used_charts

5. **ai_analytics_logs** - AI-generated insights tracking:
   - query, response, model_used
   - confidence_score, feedback

6. **user_alerts** - Alerts and anomaly tracking:
   - alert_type, message, severity
   - triggered_on, status

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user-tracking/profile` | GET/POST | Get/update user profile |
| `/api/user-tracking/activity-log` | GET/POST | Get/log user activities |
| `/api/user-tracking/summary` | GET | User analytics summary (30 days) |
| `/api/user-tracking/heatmap` | GET | Activity heatmap for behavioral analytics |
| `/api/user-tracking/uploads` | GET | Get user upload history |
| `/api/user-tracking/analytics/ai-log` | POST | Log AI interaction |
| `/api/user-tracking/analytics/ai-usage` | GET | AI usage statistics |
| `/api/user-tracking/alerts` | GET/POST | Get/create user alerts |
| `/api/user-tracking/export` | GET | Export user activity report |
| `/api/user-tracking/ws/{user_id}` | WebSocket | Real-time tracking |

## Frontend (React + TypeScript)

### Hooks

- `useUserTracking()` - Core tracking hook
- `useDashboardTracking(dashboardId)` - Dashboard-specific tracking
- `useChartTracking()` - Chart interaction tracking

### Components

- Enhanced `Profile.jsx` with:
  - Personal details display
  - Login history table
  - Recent activities timeline
  - Uploaded files list
  - AI usage stats panel
  - Activity insights panel

## Real-time Features

WebSocket endpoint `/api/user-tracking/ws/{user_id}` broadcasts:
- User activity events
- Real-time notifications
- Live dashboard updates

## MongoDB Indexes

Performance indexes on:
- `user_id` - Fast user lookups
- `timestamp` - Time-range queries

## Usage Examples

### Track a chart click (Frontend)
```typescript
const { trackChartClick } = useChartTracking();
trackChartClick("bar", "revenue-chart", "dashboard-1");
```

### Log AI interaction (Frontend)
```typescript
await userTrackingApi.logAI(query, response, "OpenAI", 0.95);
```

### Get user activity summary (Backend)
```python
summary = await user_tracking_service.get_user_analytics_summary(user_id, days=30)
```