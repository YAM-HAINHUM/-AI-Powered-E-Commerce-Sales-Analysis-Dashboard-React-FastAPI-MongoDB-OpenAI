/**
 * React Query hook for fetching dashboard data.
 */
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import type { DashboardData } from "@/types";

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await dashboardApi.getDashboard();
      return res.data as DashboardData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
