import { useState, useEffect, useRef } from "react"
import { useDashboard } from "@/hooks/useDashboard"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
  Save, RotateCcw, Layout, Maximize2, Trash2,
  Move, AlertCircle, Plus, DollarSign, ShoppingCart,
  TrendingUp, PieChart as PieIcon, BarChart2, Users, CheckCircle2,
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import type { DashboardData } from "@/types"

// ── Mock fallback (same as DashboardPage) ─────────────────────────────────────
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
    { name: "Bob Martinez", spent: 3960, orders: 11 },
    { name: "Carol White", spent: 3240, orders: 9 },
    { name: "David Kim", spent: 2780, orders: 8 },
  ],
  category_revenue: [
    { category: "Electronics", revenue: 18200 },
    { category: "Fashion", revenue: 12100 },
    { category: "Home & Garden", revenue: 9800 },
    { category: "Sports", revenue: 5400 },
    { category: "Books", revenue: 2820 },
  ],
  top_products: [
    { name: "Wireless Headphones", units: 48 },
    { name: "Smart Watch", units: 39 },
    { name: "Running Shoes", units: 34 },
    { name: "Coffee Maker", units: 28 },
    { name: "Yoga Mat", units: 22 },
  ],
}

// ── Types ─────────────────────────────────────────────────────────────────────
type WidgetType = "kpi_revenue" | "kpi_orders" | "kpi_aov" | "kpi_customers" | "chart_revenue" | "chart_category" | "chart_products" | "list_customers"
type WidgetSize = "small" | "large"

interface Widget {
  id: string
  title: string
  type: WidgetType
  size: WidgetSize
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: "w-1", title: "Total Revenue", type: "kpi_revenue", size: "small" },
  { id: "w-2", title: "Total Orders", type: "kpi_orders", size: "small" },
  { id: "w-3", title: "Revenue Trend", type: "chart_revenue", size: "large" },
  { id: "w-4", title: "Category Split", type: "chart_category", size: "small" },
  { id: "w-5", title: "Best Products", type: "chart_products", size: "small" },
  { id: "w-6", title: "Top Customers", type: "list_customers", size: "small" },
]

const ADD_OPTIONS: { type: WidgetType; label: string; icon: React.ElementType }[] = [
  { type: "kpi_revenue",   label: "Revenue KPI",     icon: DollarSign },
  { type: "kpi_orders",    label: "Orders KPI",      icon: ShoppingCart },
  { type: "kpi_aov",       label: "AOV KPI",         icon: TrendingUp },
  { type: "kpi_customers", label: "Customers KPI",   icon: Users },
  { type: "chart_revenue", label: "Revenue Chart",   icon: TrendingUp },
  { type: "chart_category",label: "Category Chart",  icon: PieIcon },
  { type: "chart_products",label: "Products Chart",  icon: BarChart2 },
  { type: "list_customers",label: "Customer List",   icon: Users },
]

const COLORS = ["#818cf8", "#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#f87171"]
const tooltipStyle = { background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#e2e8f0", fontSize: 11 }

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ease: "easeOut" as const },
  }),
} as const


// ── Widget content renderer ───────────────────────────────────────────────────
function WidgetContent({ widget, data }: { widget: Widget; data: DashboardData }) {
  const { kpis, monthly_trend, category_revenue, top_products, top_customers } = data

  switch (widget.type) {
    case "kpi_revenue":
      return (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-lg bg-indigo-500 flex items-center justify-center">
              <DollarSign className="size-4 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Total Revenue</span>
          </div>
          <div className="text-3xl font-black text-white">{formatCurrency(kpis.total_revenue)}</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">+{kpis.revenue_growth}% vs last month</div>
        </div>
      )

    case "kpi_orders":
      return (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-lg bg-violet-500 flex items-center justify-center">
              <ShoppingCart className="size-4 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Total Orders</span>
          </div>
          <div className="text-3xl font-black text-white">{formatNumber(kpis.total_orders)}</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">+{kpis.orders_growth}% vs last month</div>
        </div>
      )

    case "kpi_aov":
      return (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-lg bg-cyan-500 flex items-center justify-center">
              <TrendingUp className="size-4 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Avg Order Value</span>
          </div>
          <div className="text-3xl font-black text-white">{formatCurrency(kpis.avg_order_value)}</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">+5.6% vs last month</div>
        </div>
      )

    case "kpi_customers":
      return (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Users className="size-4 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Customers</span>
          </div>
          <div className="text-3xl font-black text-white">{formatNumber(kpis.total_customers)}</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">+22.0% vs last month</div>
        </div>
      )

    case "chart_revenue":
      return (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )

    case "chart_category":
      return (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={category_revenue}
                dataKey="revenue"
                nameKey="category"
                cx="50%" cy="50%"
                outerRadius={75}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  (percent ?? 0) > 0.08 ? `${String(name ?? "").split(" ")[0]} ${((percent ?? 0) * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {category_revenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )

    case "chart_products":
      return (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top_products} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#64748b" }} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="units" fill="#a78bfa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )

    case "list_customers":
      return (
        <div className="space-y-2.5">
          {top_customers.slice(0, 4).map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">{c.orders} orders</div>
              </div>
              <div className="text-xs font-bold text-emerald-400">{formatCurrency(c.spent)}</div>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardBuilderPage() {
  const { data: apiData, isLoading } = useDashboard()
  const data: DashboardData = apiData ?? MOCK

  const [widgets, setWidgets] = useState<Widget[]>([])
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "reset">("")

  // Drag state — using refs to avoid stale closure issues
  const dragIndexRef = useRef<number | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("custom-dashboard-layout")
    if (saved) {
      try { setWidgets(JSON.parse(saved)) } catch { setWidgets(DEFAULT_WIDGETS) }
    } else {
      setWidgets(DEFAULT_WIDGETS)
    }
  }, [])

  const flashStatus = (s: "saved" | "reset") => {
    setSaveStatus(s)
    setTimeout(() => setSaveStatus(""), 2500)
  }

  const handleSave = () => {
    localStorage.setItem("custom-dashboard-layout", JSON.stringify(widgets))
    flashStatus("saved")
  }

  const handleReset = () => {
    setWidgets(DEFAULT_WIDGETS)
    localStorage.removeItem("custom-dashboard-layout")
    flashStatus("reset")
  }

  const toggleSize = (id: string) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, size: w.size === "small" ? "large" : "small" } : w))
  }

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }

  const addWidget = (type: WidgetType, label: string) => {
    setWidgets((prev) => [...prev, { id: `w-${Date.now()}`, title: label, type, size: "small" }])
  }

  // ── Drag handlers (native HTML5, avoids Framer Motion conflict) ────────────
  const handleDragStart = (e: React.DragEvent, index: number, id: string) => {
    dragIndexRef.current = index
    setDragId(id)
    e.dataTransfer.effectAllowed = "move"
    // Transparent ghost
    const ghost = document.createElement("div")
    ghost.style.cssText = "position:fixed;top:-999px;width:1px;height:1px"
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const handleDragEnter = (index: number) => {
    if (dragIndexRef.current === null || dragIndexRef.current === index) return
    setOverIndex(index)
    setWidgets((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndexRef.current!, 1)
      next.splice(index, 0, moved)
      dragIndexRef.current = index
      return next
    })
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragId(null)
    setOverIndex(null)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array(4).fill(0).map((_, i) => <div key={i} className="glass-card rounded-2xl h-48" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="p-6 space-y-6"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="size-6 text-indigo-400" /> Dashboard Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Drag to reorder · resize · add or remove widgets · save your layout
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {saveStatus && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                  saveStatus === "saved"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                {saveStatus === "saved" ? "Layout saved!" : "Reset to default"}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold"
            style={{ boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
          >
            <Save className="size-4" /> Save Layout
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="size-4" /> Reset
          </motion.button>
        </div>
      </motion.div>

      {/* ── Add widgets panel ───────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="glass-card rounded-xl p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Plus className="size-3.5" /> Add Widgets
        </div>
        <div className="flex flex-wrap gap-2">
          {ADD_OPTIONS.map(({ type, label, icon: Icon }) => (
            <motion.button
              key={type + label}
              onClick={() => addWidget(type, label)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground font-medium hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
            >
              <Icon className="size-3.5" /> {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      {widgets.length === 0 ? (
        <motion.div variants={fadeUp}
          className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-2xl text-center"
        >
          <AlertCircle className="size-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-muted-foreground">Dashboard is empty</h3>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Use the buttons above to add analytics widgets to your workspace
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {widgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: dragId === widget.id ? 0.4 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ layout: { type: "spring", stiffness: 400, damping: 35 } }}
                draggable
                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index, widget.id)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`glass-card rounded-2xl p-5 flex flex-col gap-4 transition-all duration-150 ${
                  widget.size === "large" ? "lg:col-span-2" : "lg:col-span-1"
                } ${overIndex === index && dragId !== widget.id ? "border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : ""}`}
              >
                {/* Widget header */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Move className="size-4 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
                    <span className="text-sm font-semibold">{widget.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleSize(widget.id)}
                      title={widget.size === "small" ? "Expand to full width" : "Shrink to half width"}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Maximize2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-rose-500/15 text-muted-foreground hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Widget body */}
                <div className="flex-1">
                  <WidgetContent widget={widget} data={data} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mock data notice */}
      {!apiData && (
        <motion.div variants={fadeUp}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/15 bg-amber-500/5 text-amber-400/80 text-xs"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          Showing sample data — start the backend to load live metrics.
        </motion.div>
      )}
    </motion.div>
  )
}
