/**
 * useDashboardFilters — shared filter state + derived filtered data.
 * Import this in DashboardPage and pass the result down to FiltersBar.
 */
import { useState, useMemo } from "react"
import type { DashboardData, MonthlyTrend, CategoryRevenue, TopProduct } from "@/types"

export type DateRange = "7d" | "30d" | "90d" | "all"
export type CategoryFilter = "all" | "Electronics" | "Fashion" | "Home & Garden" | "Sports" | "Books"
export type RegionFilter = "all" | "North" | "South" | "East" | "West"

export interface Filters {
  dateRange: DateRange
  category: CategoryFilter
  region: RegionFilter
}

// Month slices based on date range selection
const MONTH_COUNT: Record<DateRange, number> = { "7d": 1, "30d": 3, "90d": 6, all: 12 }

// Revenue multipliers per category (simulates category-level filtering)
const CAT_WEIGHT: Record<CategoryFilter, number> = {
  all: 1, Electronics: 0.38, Fashion: 0.25, "Home & Garden": 0.20, Sports: 0.11, Books: 0.06,
}

const REGION_WEIGHT: Record<RegionFilter, number> = {
  all: 1, North: 0.30, South: 0.25, East: 0.27, West: 0.18,
}

export function useDashboardFilters(data: DashboardData | null) {
  const [filters, setFilters] = useState<Filters>({
    dateRange: "all",
    category: "all",
    region: "all",
  })

  const filteredData = useMemo((): DashboardData | null => {
    if (!data) return null

    const catW = CAT_WEIGHT[filters.category]
    const regW = REGION_WEIGHT[filters.region]
    const multiplier = catW * regW / (CAT_WEIGHT.all * REGION_WEIGHT.all) // normalise to preserve "all" = 1

    // Slice monthly trend
    const months = MONTH_COUNT[filters.dateRange]
    const monthly_trend: MonthlyTrend[] = data.monthly_trend
      .slice(-months)
      .map(m => ({
        ...m,
        revenue: Math.round(m.revenue * multiplier),
        orders:  Math.round(m.orders  * multiplier),
      }))

    // Filter / scale category revenue
    const category_revenue: CategoryRevenue[] = filters.category === "all"
      ? data.category_revenue.map(c => ({ ...c, revenue: Math.round(c.revenue * regW) }))
      : data.category_revenue
          .filter(c => c.category === filters.category)
          .map(c => ({ ...c, revenue: Math.round(c.revenue * regW) }))

    // Scale top products
    const top_products: TopProduct[] = data.top_products.map(p => ({
      ...p,
      units: Math.max(1, Math.round(p.units * multiplier)),
    }))

    // Scale KPIs
    const kpis = {
      ...data.kpis,
      total_revenue:   Math.round(data.kpis.total_revenue   * multiplier),
      total_orders:    Math.round(data.kpis.total_orders    * multiplier),
      avg_order_value: Math.round(data.kpis.avg_order_value * (catW > 0.3 ? 1.1 : 0.9)),
    }

    return { ...data, kpis, monthly_trend, category_revenue, top_products }
  }, [data, filters])

  return { filters, setFilters, filteredData }
}
