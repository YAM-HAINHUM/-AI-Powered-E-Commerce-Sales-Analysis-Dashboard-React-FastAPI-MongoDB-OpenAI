import { useCallback, useEffect, useRef } from "react";
import { userTrackingApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useUserTracking() {
  const token = useAuthStore((s) => s.token);
  const dashboardTimeRef = useRef<Date | null>(null);
  const currentDashboardRef = useRef<string | null>(null);

  const trackActivity = useCallback(
    async (action: string, module: string, metadata: Record<string, any> = {}) => {
      if (!token) return;
      try {
        await userTrackingApi.logActivity(action, module, metadata);
      } catch (e) {
        console.error("Failed to track activity:", e);
      }
    },
    [token]
  );

  const trackChartClick = useCallback(
    async (chart_type: string, chart_id: string, dashboard_id: string) => {
      if (!token) return;
      try {
        await userTrackingApi.trackChartClick(chart_type, chart_id, dashboard_id);
      } catch (e) {
        console.error("Failed to track chart click:", e);
      }
    },
    [token]
  );

  const trackFilter = useCallback(
    async (filter_type: string, filter_value: string, dashboard_id: string) => {
      if (!token) return;
      try {
        await userTrackingApi.trackFilter(filter_type, filter_value, dashboard_id);
      } catch (e) {
        console.error("Failed to track filter:", e);
      }
    },
    [token]
  );

  const startDashboardTimer = useCallback((dashboard_id: string) => {
    dashboardTimeRef.current = new Date();
    currentDashboardRef.current = dashboard_id;
  }, []);

  const stopDashboardTimer = useCallback(async () => {
    if (dashboardTimeRef.current && currentDashboardRef.current && token) {
      const seconds = Math.floor(
        (new Date().getTime() - dashboardTimeRef.current.getTime()) / 1000
      );
      if (seconds > 0) {
        try {
          await userTrackingApi.trackTimeSpent(currentDashboardRef.current, seconds);
        } catch (e) {
          console.error("Failed to track time:", e);
        }
      }
      dashboardTimeRef.current = null;
    }
  }, [token]);

  useEffect(() => {
    return () => {
      stopDashboardTimer();
    };
  }, [stopDashboardTimer]);

  const trackAILog = useCallback(
    async (query: string, response: string, model_used?: string, confidence_score?: number) => {
      if (!token) return;
      try {
        await userTrackingApi.logAI(query, response, model_used, confidence_score);
      } catch (e) {
        console.error("Failed to log AI interaction:", e);
      }
    },
    [token]
  );

  return {
    trackActivity,
    trackChartClick,
    trackFilter,
    startDashboardTimer,
    stopDashboardTimer,
    trackAILog,
  };
}