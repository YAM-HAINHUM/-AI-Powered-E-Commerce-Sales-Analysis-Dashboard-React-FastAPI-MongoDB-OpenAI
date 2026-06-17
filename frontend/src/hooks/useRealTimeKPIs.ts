/**
 * useRealTimeKPIs — simulates live KPI ticks every 4 seconds.
 * Applies small random deltas so the dashboard feels alive without
 * full re-renders of chart components.
 */
import { useState, useEffect, useCallback, useRef } from "react"
import type { KPIs } from "@/types"

const TICK_MS = 4000

function jitter(base: number, pct = 0.015): number {
  const delta = base * pct * (Math.random() * 2 - 1)
  return Math.round((base + delta) * 100) / 100
}

export function useRealTimeKPIs(base: KPIs | null, enabled = true) {
  const [kpis, setKpis] = useState<KPIs | null>(base)
  const baseRef = useRef(base)

  // Keep ref in sync so the interval always sees the latest base
  useEffect(() => {
    baseRef.current = base
    setKpis(base)
  }, [base])

  const tick = useCallback(() => {
    if (!baseRef.current) return
    const b = baseRef.current
    setKpis({
      total_revenue:   jitter(b.total_revenue, 0.008),
      total_orders:    Math.max(0, b.total_orders + Math.floor(Math.random() * 3 - 1)),
      total_customers: Math.max(0, b.total_customers + Math.floor(Math.random() * 2)),
      avg_order_value: jitter(b.avg_order_value, 0.005),
      revenue_growth:  Math.round((b.revenue_growth + (Math.random() * 0.4 - 0.2)) * 10) / 10,
      orders_growth:   Math.round((b.orders_growth  + (Math.random() * 0.4 - 0.2)) * 10) / 10,
    })
  }, [])

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [enabled, tick])

  return kpis
}
