/**
 * Axios API client with JWT interceptor.
 * All API calls go through this instance.
 */
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

import { useAuthStore } from "@/store/authStore";

// Attach JWT token from Zustand store on every request (no localStorage)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// Normalize network errors so UI can show a consistent message
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isNetworkError =
      error?.code === "ERR_NETWORK" ||
      error?.message?.toLowerCase?.().includes("network error") ||
      (typeof error?.message === "string" && error.message === "Network Error");

    if (isNetworkError) {
      return Promise.reject(new Error("Backend unavailable (network error). Check VITE_API_URL/CORS/port."));
    }

    return Promise.reject(error);
  }
);


// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  signup: (username: string, email: string, password: string, full_name?: string) =>
    api.post("/api/auth/signup", { username, email, password, full_name }),
  me: () => api.get("/api/auth/me"),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  // Use absolute path to avoid any router/baseURL quirks
  getDashboard: () => api.get("/api/dashboard"),
};

// ── Premium SaaS ─────────────────────────────────────────────────────────────
export const saasApi = {
  health: () => api.get("/api/health"),
  goals: () => api.get("/api/goals"),
  alerts: () => api.get("/api/alerts"),
  trends: () => api.get("/api/trends"),
  compare: () => api.get("/api/compare"),
};



// ── Customers ─────────────────────────────────────────────────────────────────
export const customersApi = {
  list: (page = 1, limit = 20, search = "") =>
    api.get(`/api/customers?page=${page}&limit=${limit}&search=${search}`),
  get: (id: string) => api.get(`/api/customers/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  monthly: () => api.get("/api/analytics/monthly-sales"),
  topCustomers: () => api.get("/api/analytics/top-customers"),
  categoryRevenue: () => api.get("/api/analytics/category-revenue"),
  bestProducts: () => api.get("/api/analytics/best-selling-products"),
  customerRanking: () => api.get("/api/analytics/customer-ranking"),
};

// ── SQL Query ─────────────────────────────────────────────────────────────────
export const sqlApi = {
  execute: (query: string, natural_language?: string) =>
    api.post("/api/sql-query", { query, natural_language }),
  listPredefined: () => api.get("/api/sql-query/predefined"),
  runPredefined: (name: string) => api.get(`/api/sql-query/predefined/${name}`),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiApi = {
  generateInsight: (insight_type: string, context?: string) =>
    api.post("/api/ai-insights/generate", { insight_type, context }),
  nlpToSql: (question: string) =>
    api.post("/api/ai-insights/nlp-to-sql", { question }),
  recommendations: () => api.get("/api/ai-insights/recommendations"),
  summary: () => api.get("/api/ai-insights/summary"),
};


// ── Advanced AI & BI ─────────────────────────────────────────────────────────
export const advancedApi = {
  forecast: () => api.get("/api/forecast"),
  anomaly: () => api.get("/api/anomaly"),
  anomalies: () => api.get("/api/anomalies"),
  segmentation: () => api.get("/api/segmentation"),
  segments: () => api.get("/api/segments"),
  recommendation: (productId?: string) =>
    api.get(`/api/recommendation${productId ? `?product_id=${productId}` : ""}`),
  recommendations: (productId?: string) =>
    api.get(`/api/recommendations${productId ? `?product_id=${productId}` : ""}`),
  churn: () => api.get("/api/churn"),
  productScore: () => api.get("/api/product-score"),
  pricing: () => api.get("/api/pricing"),
  clv: () => api.get("/api/clv"),
  cityRevenue: () => api.get("/api/city-revenue"),
  cohort: () => api.get("/api/cohort"),
  retention: () => api.get("/api/retention"),
  uploadDataset: (formData: FormData) =>
    api.post("/api/upload/dataset", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  downloadSample: () =>
    api.get("/api/upload/sample", { responseType: "blob" }),
  exportPdf: (payload: object) =>
    api.post("/api/upload/export-pdf", payload, { responseType: "blob" }),
  exportCsv: (payload: object) =>
    api.post("/api/upload/export-csv", payload, { responseType: "blob" }),
  downloadReport: () =>
    api.get("/api/report/download", { responseType: "blob" }),
  downloadExcel: () =>
    api.get("/api/report/download-excel", { responseType: "blob" }),
};


// ── User Tracking ───────────────────────────────────────────────────────────────
export const userTrackingApi = {
  getProfile: () => api.get("/api/user-tracking/profile"),
  updateProfile: (personal_info?: object, account_settings?: object) =>
    api.post("/api/user-tracking/profile", { personal_info, account_settings }),
  getActivities: (limit?: number) =>
    api.get(`/api/user-tracking/activity-log?limit=${limit || 50}`),
  logActivity: (action: string, module: string, metadata?: object) =>
    api.post("/api/user-tracking/activity-log", { action, module, metadata }),
  getSummary: (days?: number) =>
    api.get(`/api/user-tracking/summary?days=${days || 30}`),
  getHeatmap: (days?: number) =>
    api.get(`/api/user-tracking/heatmap?days=${days || 30}`),
  getUploads: () => api.get("/api/user-tracking/uploads"),
  trackChartClick: (chart_type: string, chart_id: string, dashboard_id: string, metadata?: object) =>
    api.post("/api/user-tracking/interactions/chart-click", { chart_type, chart_id, dashboard_id, metadata }),
  trackFilter: (filter_type: string, filter_value: string, dashboard_id: string) =>
    api.post("/api/user-tracking/interactions/filter", { filter_type, filter_value, dashboard_id }),
  trackTimeSpent: (dashboard_id: string, seconds: number) =>
    api.post("/api/user-tracking/interactions/time-spent", { dashboard_id, seconds }),
  logAI: (query: string, response: string, model_used?: string, confidence_score?: number) =>
    api.post("/api/user-tracking/analytics/ai-log", { query, response, model_used, confidence_score }),
  getAIUsage: () => api.get("/api/user-tracking/analytics/ai-usage"),
  getAlerts: (status?: string) =>
    api.get(`/api/user-tracking/alerts?status=${status || "all"}`),
  resolveAlert: (alert_id: string) =>
    api.patch(`/api/user-tracking/alerts/${alert_id}/resolve`),
  exportReport: (format?: string) =>
    api.get(`/api/user-tracking/export?format=${format || "json"}`),
};
