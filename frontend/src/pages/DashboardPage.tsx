import { useDashboard } from "@/hooks/useDashboard"
import { useDashboardFilters } from "@/hooks/useDashboardFilters"
import { useRealTimeKPIs } from "@/hooks/useRealTimeKPIs"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { DollarSign, ShoppingCart, Users, TrendingUp, RefreshCw, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"
import type { DashboardData } from "@/types"
import { useTheme } from "@/components/theme-provider"
import { FiltersBar } from "@/components/FiltersBar"
import { AIInsightsPanel } from "@/components/AIInsightsPanel"
import { ExportButtons } from "@/components/ExportButtons"
import { LiveKPICard } from "@/components/LiveKPICard"
import { fadeUp, staggerContainer } from "@/lib/animations"

const COLORS = ["#818cf8", "#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#f87171"]

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return {
    tooltip: dark
      ? { background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0" }
      : { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    tick:  dark ? "#94a3b8" : "#64748b",
    grid:  dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
  }
}

// ── Fallback mock ─────────────────────────────────────────────────────────────
const MOCK: DashboardData = {
  kpis: { total_revenue: 48320, total_orders: 342, total_customers: 87, avg_order_value: 284, revenue_growth: 18.3, orders_growth: 12.1 },
  monthly_trend: [
    { month: "Jan", revenue: 3200, orders: 22 }, { month: "Feb", revenue: 4100, orders: 28 },
    { month: "Mar", revenue: 3800, orders: 25 }, { month: "Apr", revenue: 5200, orders: 36 },
    { month: "May", revenue: 4600, orders: 31 }, { month: "Jun", revenue: 6100, orders: 42 },
    { month: "Jul", revenue: 5400, orders: 38 }, { month: "Aug", revenue: 7200, orders: 50 },
    { month: "Sep", revenue: 6300, orders: 44 }, { month: "Oct", revenue: 8100, orders: 56 },
    { month: "Nov", revenue: 7400, orders: 51 }, { month: "Dec", revenue: 9100, orders: 62 },
  ],
  top_customers: [
    { name: "Alice Johnson", spent: 4820, orders: 14 },
    { name: "Bob Martinez",  spent: 3960, orders: 11 },
    { name: "Carol White",   spent: 3240, orders: 9  },
    { name: "David Kim",     spent: 2780, orders: 8  },
    { name: "Emma Davis",    spent: 2100, orders: 6  },
  ],
  category_revenue: [
    { category: "Electronics",   revenue: 18200 },
    { category: "Fashion",       revenue: 12100 },
    { category: "Home & Garden", revenue: 9800  },
    { category: "Sports",        revenue: 5400  },
    { category: "Books",         revenue: 2820  },
  ],
  top_products: [
    { name: "Wireless Headphones", units: 48 },
    { name: "Smart Watch",         units: 39 },
    { name: "Running Shoes",       units: 34 },
    { name: "Coffee Maker",        units: 28 },
    { name: "Yoga Mat",            units: 22 },
  ],
}

const renderPieLabel = ({ name, percent }: PieLabelRenderProps) => {
  if (percent === undefined || (percent as number) < 0.08) return null
  return `${String(name).split(" ")[0]} ${((percent as number) * 100).toFixed(0)}%`
}

export default function DashboardPage() {
  const { data: apiData, isLoading, isError, error, refetch } = useDashboard()
  const { tooltip, tick, grid } = useChartTheme()

  // Filters — derive filtered view from raw data
  const rawData: DashboardData = apiData ?? MOCK
  const { filters, setFilters, filteredData } = useDashboardFilters(rawData)
  const data = filteredData ?? rawData

  // Live KPI simulation — ticks every 4 s on top of the filtered KPIs
  const liveKpis = useRealTimeKPIs(data.kpis, true)
  const kpis = liveKpis ?? data.kpis

  const usingMock = !apiData

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="glass-card rounded-xl p-4 h-14 animate-pulse" />
        <div className="grid lg:grid-cols-2 gap-4">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-72 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const { monthly_trend, top_customers, category_revenue, top_products } = data

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-6 space-y-6"
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your e-commerce performance at a glance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons data={data} filters={filters} />
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          >
            <RefreshCw className="size-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Error / mock banner ──────────────────────────────────────────── */}
      {(isError || usingMock) && (
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>
            {isError
              ? `Backend unavailable${error instanceof Error ? `: ${error.message}` : ""}. `
              : "Showing sample data. "}
            Start with{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              uvicorn app.main:app --reload --port 8000
            </code>
          </span>
        </motion.div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <FiltersBar filters={filters} onChange={setFilters} />
      </motion.div>

      {/* ── Live KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LiveKPICard
          index={0} icon={DollarSign} label="Total Revenue"
          value={kpis.total_revenue}
          change={`+${kpis.revenue_growth}%`}
          color="bg-indigo-500"
          format={n => formatCurrency(n)}
          live
        />
        <LiveKPICard
          index={1} icon={ShoppingCart} label="Total Orders"
          value={kpis.total_orders}
          change={`+${kpis.orders_growth}%`}
          color="bg-violet-500"
          format={n => formatNumber(Math.round(n))}
          live
        />
        <LiveKPICard
          index={2} icon={Users} label="Customers"
          value={kpis.total_customers}
          change="+22.0%"
          color="bg-cyan-500"
          format={n => formatNumber(Math.round(n))}
          live
        />
        <LiveKPICard
          index={3} icon={TrendingUp} label="Avg Order Value"
          value={kpis.avg_order_value}
          change="+5.6%"
          color="bg-emerald-500"
          format={n => formatCurrency(n)}
          live
        />
      </div>

      {/* ── AI Insights Panel ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={4}>
        <AIInsightsPanel data={data} />
      </motion.div>

      {/* ── Charts row 1 ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} custom={5} className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-4">Monthly Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick }} />
              <YAxis tick={{ fontSize: 11, fill: tick }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltip} formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#818cf8" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fadeUp} custom={6} className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-4">Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={category_revenue}
                dataKey="revenue"
                nameKey="category"
                cx="50%" cy="50%"
                outerRadius={80}
                label={renderPieLabel}
                labelLine={false}
              >
                {category_revenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltip} formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Charts row 2 ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} custom={7} className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-4">Best Selling Products</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top_products} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: tick }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: tick }} width={130} />
              <Tooltip contentStyle={tooltip} />
              <Bar dataKey="units" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fadeUp} custom={8} className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-4">Top Customers</h2>
          <div className="space-y-3">
            {top_customers.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div className="size-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.orders} orders</div>
                </div>
                <div className="text-sm font-semibold text-emerald-400">{formatCurrency(c.spent)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
