// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// ── User Tracking ───────────────────────────────────────────────────────────────
export interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  profile_picture: string;
  role: string;
  organization: string;
}

export interface AccountSettings {
  theme: "dark" | "light";
  language: string;
  notifications: boolean;
  timezone: string;
}

export interface SecurityInfo {
  last_login: string | null;
  login_history: LoginHistoryItem[];
  two_fa_enabled: boolean;
  devices: DeviceInfo[];
}

export interface LoginHistoryItem {
  ip: string;
  device: string;
  timestamp: string;
}

export interface DeviceInfo {
  name: string;
  type: string;
  last_active: string;
}

export interface UserActivity {
  _id: string;
  action: string;
  module: string;
  timestamp: string;
  ip_address: string;
  device: string;
  metadata: Record<string, any>;
}

export interface DataUpload {
  _id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  upload_time: string;
  columns_detected: string[];
  rows_count: number;
  data_summary: Record<string, any>;
  ai_insights_generated: boolean;
  dataset_id: string;
}

export interface AIUsageStats {
  total_queries: number;
  model_usage: Record<string, number>;
  recent: AILogItem[];
}

export interface AILogItem {
  query: string;
  timestamp: string;
  model_used: string;
}

export interface Alert {
  _id: string;
  alert_type: string;
  message: string;
  severity: "low" | "medium" | "high";
  triggered_on: string;
  status: "resolved" | "pending";
  metadata: Record<string, any>;
}

export interface VisualizationInteraction {
  chart_type: string;
  data_source: string;
  filters_applied: string[];
  interaction_count: number;
  last_viewed: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface KPIs {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  avg_order_value: number;
  revenue_growth: number;
  orders_growth: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopCustomer {
  name: string;
  spent: number;
  orders: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
}

export interface TopProduct {
  name: string;
  units: number;
}

export interface DashboardData {
  kpis: KPIs;
  monthly_trend: MonthlyTrend[];
  top_customers: TopCustomer[];
  category_revenue: CategoryRevenue[];
  top_products: TopProduct[];
}

// ── SQL Query ─────────────────────────────────────────────────────────────────
export interface QueryResult {
  columns: string[];
  rows: (string | number | null)[][];
  row_count: number;
  execution_time_ms: number;
  query_used: string;
}

export interface PredefinedQuery {
  name: string;
  sql: string;
}

// ── AI ────────────────────────────────────────────────────────────────────────
export interface Recommendation {
  title: string;
  priority: "high" | "medium" | "low";
  category: string;
  description: string;
  estimated_impact: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

// ── Customer ──────────────────────────────────────────────────────────────────
export interface Customer {
  customer_id: string;
  name: string;
  city: string;
  signup_date: string;
  total_orders: number;
  total_spent: number;
}
