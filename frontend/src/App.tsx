import React, { Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ThemeProvider } from "@/components/theme-provider"
import { useAuthStore } from "@/store/authStore"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import AppLayout from "@/components/AppLayout"
import DashboardPage from "@/pages/DashboardPage"
import AnalyticsPage from "@/pages/AnalyticsPage"
import SQLPage from "@/pages/SQLPage"
import AIInsightsPage from "@/pages/AIInsightsPage"
import CustomersPage from "@/pages/CustomersPage"
import AdvancedAnalyticsPage from "@/pages/AdvancedAnalyticsPage"
import DashboardBuilderPage from "@/pages/DashboardBuilderPage"
import DataUploadPage from "@/pages/DataUploadPage"
import LiveDataPage from "@/pages/LiveDataPage"
import ReportsPage from "@/pages/ReportsPage"

// New Page Imports
import ForecastPage from "@/pages/ForecastPage"
import AnomaliesPage from "@/pages/AnomaliesPage"
import RecommendationsPage from "@/pages/RecommendationsPage"
import SegmentsPage from "@/pages/SegmentsPage"
import ChurnPage from "@/pages/ChurnPage"
import ProductScorePage from "@/pages/ProductScorePage"
import PricingPage from "@/pages/PricingPage"
import AIReportsPage from "@/pages/AIReportsPage"
import DataIntelligencePage from "@/pages/DataIntelligencePage"

// Premium SaaS pages
import Trends from "@/pages/Trends"
import TrendDetail from "@/pages/TrendDetail"
import Goals from "@/pages/Goals"
import GoalDetail from "@/pages/GoalDetail"
import Health from "@/pages/Health"
import HealthDetail from "@/pages/HealthDetail"
import Alerts from "@/pages/Alerts"
import AlertDetail from "@/pages/AlertDetail"
import Compare from "@/pages/Compare"
import CompareDetail from "@/pages/CompareDetail"
import Profile from "@/pages/Profile"
import Settings from "@/pages/Settings"


const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } })

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="datainsight-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Suspense fallback={null}>
                    <AppLayout />
                  </Suspense>
                </ProtectedRoute>

              }
            >

              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />

              <Route path="advanced-analytics" element={<AdvancedAnalyticsPage />} />
              <Route path="dashboard-builder" element={<DashboardBuilderPage />} />
              <Route path="upload" element={<DataUploadPage />} />
              <Route path="sql" element={<SQLPage />} />
              <Route path="ai-insights" element={<AIInsightsPage />} />
              <Route path="live-data" element={<LiveDataPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              
              {/* New Advanced AI Routes */}
              <Route path="forecast" element={<ForecastPage />} />
              <Route path="anomalies" element={<AnomaliesPage />} />
              <Route path="recommendations" element={<RecommendationsPage />} />
              <Route path="segments" element={<SegmentsPage />} />
              <Route path="churn" element={<ChurnPage />} />
              <Route path="product-score" element={<ProductScorePage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="ai-reports" element={<AIReportsPage />} />
              <Route path="data-intelligence" element={<DataIntelligencePage />} />

              {/* Premium SaaS Routes */}
              <Route path="health" element={<Health />} />
              <Route path="health/:factorId" element={<HealthDetail />} />

              <Route path="goals" element={<Goals />} />
              <Route path="goals/:goalId" element={<GoalDetail />} />

              <Route path="alerts" element={<Alerts />} />
              <Route path="alerts/:alertId" element={<AlertDetail />} />

              <Route path="trends" element={<Trends />} />
              <Route path="trends/:trendId" element={<TrendDetail />} />

              <Route path="compare" element={<Compare />} />
              <Route path="compare/:compareId" element={<CompareDetail />} />

              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />




            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

