import { useCallback, useEffect, useRef } from "react";
import { userTrackingApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useChartTracking() {
  const token = useAuthStore((s) => s.token);

  const trackChartClick = useCallback(
    async (chartType: string, chartId: string, dashboardId: string, data?: any) => {
      if (!token) return;
      try {
        await userTrackingApi.trackChartClick(chartType, chartId, dashboardId, data);
      } catch (e) {
        console.error("Failed to track chart click:", e);
      }
    },
    [token]
  );

  const trackChartHover = useCallback(
    async (chartType: string, chartId: string, dashboardId: string) => {
      if (!token) return;
      try {
        await userTrackingApi.logActivity("chart_hover", "dashboard", { chartType, chartId });
      } catch (e) {
        console.error("Failed to track chart hover:", e);
      }
    },
    [token]
  );

  return { trackChartClick, trackChartHover };
}