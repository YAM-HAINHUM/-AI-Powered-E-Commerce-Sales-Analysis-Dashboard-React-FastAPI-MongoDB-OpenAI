import { useEffect, useRef, useState } from "react";
import { useUserTracking } from "@/hooks/useUserTracking";

export function useDashboardTracking(dashboardId: string) {
  const { trackChartClick, trackFilter, startDashboardTimer, stopDashboardTimer } = useUserTracking();
  const timeSpentInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const accumulatedTime = useRef(0);

  useEffect(() => {
    startDashboardTimer(dashboardId);
    accumulatedTime.current = 0;

    timeSpentInterval.current = setInterval(() => {
      accumulatedTime.current += 1;
    }, 1000);

    return () => {
      if (timeSpentInterval.current) {
        clearInterval(timeSpentInterval.current);
      }
      stopDashboardTimer();
    };
  }, [dashboardId, startDashboardTimer, stopDashboardTimer]);

  const trackChartInteraction = (chartType: string, chartId: string, dataSource: string, filters: string[] = []) => {
    trackChartClick(chartType, chartId, dashboardId);
  };

  const trackFilterChange = (filterType: string, filterValue: string) => {
    trackFilter(filterType, filterValue, dashboardId);
  };

  return {
    trackChartInteraction,
    trackFilterChange,
  };
}