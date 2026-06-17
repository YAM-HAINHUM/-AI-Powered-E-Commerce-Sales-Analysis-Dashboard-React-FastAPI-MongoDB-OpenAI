import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity, DollarSign, ShoppingCart, Users, TrendingUp,
  Wifi, WifiOff, Pause, Play, Zap, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useTheme } from "@/components/theme-provider"
import { formatCurrency, formatNumber } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────
interface KPISnapshot {
  revenue: number
  orders: number
  customers: number
  aov: number
  ts: string          // "HH:MM:SS"
}

interface LiveOrder {
  id: string
  customer: string
  product: string
  category: string
  amount: number
  ts: string
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED: KPISnapshot = {
  revenue: 48320, orders: 342, customers: 87, aov: 284, ts: "",
}

const PRODUCTS = [
  ["Wireless Headphones","Electronics"],["Smart Watch","Electronics"],
  ["Running Shoes","Sports"],["Coffee Maker","Home"],["Yoga Mat","Sports"],
  ["Laptop Stand","Electronics"],["Skincare Set","Beauty"],["Novel: Dune","Books"],
]
const NAMES = [
  "Alice Johnson","Bob Martinez","Carol White","David Kim",
  "Emma Davis","Frank Lee","Grace Patel","Henry Brown",
]

function makeOrder(): LiveOrder {
  const [product, category] = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
  return {
    id: `#${Math.floor(Math.random() * 90000 + 10000)}`,
    customer: NAMES[Math.floor(Math.random() * NAMES.length)],
    product, category,
    amount: Math.round(50 + Math.random() * 450),
    ts: new Date().toLocaleTimeString(),
  }
}

function jitter(v: number, pct = 0.012) {
  return Math.round(v + v * pct * (Math.random() * 2 - 1))
}

function nowHMS() {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function useChartStyle() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return {
    tooltip: dark
      ? { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 11 }
      : { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0f172a", fontSize: 11 },
    tick:  dark ? "#64748b" : "#94a3b8",
    grid:  dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
  }
}

// ── Animated KPI number ───────────────────────────────────────────────────────
function AnimatedValue({ value, formatter }: { value: number; formatter: (n: number) => string }) {
  const [display, setDisplay] = useState(value)
  const from = useRef(value)
  const raf  = useRef<number>(0)

  useEffect(() => {
    const start = from.current
    const diff  = value - start
    if (diff === 0) return
    let startTs: number
    const step = (ts: number) => {
      if (!startTs) startTs = ts
      const p = Math.min((ts - startTs) / 500, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisplay(start + diff * e)
      if (p < 1) raf.current = requestAnimationFrame(step)
      else from.current = value
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value])

  return <span className="tabular-nums">{formatter(display)}</span>
}

// ── Single KPI card ───────────────────────────────────────────────────────────
interface KPICardProps {
  icon: React.ElementType
  label: string
  value: number
  prevValue: number
  formatter: (n: number) => string
  color: string
  glow: string
  sparkline: number[]
  sparkColor: string
}

function KPICard({ icon: Icon, label, value, prevValue, formatter, color, glow, sparkline, sparkColor }: KPICardProps) {
  const delta    = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0
  const positive = delta >= 0
  const { tooltip, tick, grid } = useChartStyle()
  const sparkData = sparkline.map((v, i) => ({ i, v }))

  return (
    <motion.div
      layout
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="glass-card rounded-xl p-5 relative overflow-hidden cursor-default"
      style={{ boxShadow: `0 0 30px ${glow}10` }}
    >
      {/* Glow accent */}
      <div
        className="absolute top-0 right-0 size-24 rounded-full blur-2xl pointer-events-none opacity-20"
        style={{ background: glow }}
      />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}
          style={{ boxShadow: `0 0 14px ${glow}60` }}>
          <Icon className="size-4 text-white" />
        </div>
        {/* Live delta badge */}
        <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
          positive
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
            : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
        }`}>
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta).toFixed(2)}%
        </div>
      </div>

      <div className="relative z-10 mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="relative z-10 text-2xl font-black text-foreground">
        <AnimatedValue value={value} formatter={formatter} />
      </div>

      {/* Sparkline */}
      <div className="mt-3 h-12 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={sparkColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5}
              fill={`url(#grad-${label})`} dot={false}
            />
            <Tooltip contentStyle={tooltip}
              formatter={(v: unknown) => [formatter(Number(v)), label]} labelFormatter={() => ""} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// ── Category badge ────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Electronics: "bg-indigo-500/15 text-indigo-300",
  Sports:      "bg-emerald-500/15 text-emerald-300",
  Home:        "bg-amber-500/15 text-amber-300",
  Beauty:      "bg-pink-500/15 text-pink-300",
  Books:       "bg-cyan-500/15 text-cyan-300",
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function LiveDataPage() {
  const [paused,     setPaused]     = useState(false)
  const [connected,  setConnected]  = useState(true)
  const [kpi,        setKpi]        = useState<KPISnapshot>({ ...SEED, ts: nowHMS() })
  const [prevKpi,    setPrevKpi]    = useState<KPISnapshot>({ ...SEED, ts: nowHMS() })
  const [history,    setHistory]    = useState<KPISnapshot[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      revenue:   SEED.revenue   + (i - 10) * 400 + Math.random() * 300,
      orders:    SEED.orders    + Math.floor((i - 10) * 2 + Math.random() * 4),
      customers: SEED.customers + Math.floor((i - 10) * 0.5 + Math.random() * 2),
      aov:       SEED.aov       + (i - 10) * 3 + Math.random() * 10,
      ts:        `T-${20 - i}s`,
    }))
  )
  const [orders, setOrders] = useState<LiveOrder[]>(() =>
    Array.from({ length: 6 }, makeOrder)
  )
  const [totalOrders,   setTotalOrders]   = useState(0)
  const [ordersPerMin,  setOrdersPerMin]  = useState(0)
  const ordersThisMin = useRef(0)
  const { tooltip, tick, grid } = useChartStyle()

  // Simulate a WebSocket-like tick every 3 s
  const doTick = useCallback(() => {
    if (paused) return

    setKpi(prev => {
      const next: KPISnapshot = {
        revenue:   jitter(prev.revenue, 0.009),
        orders:    Math.max(0, prev.orders + Math.floor(Math.random() * 5 - 2)),
        customers: Math.max(0, prev.customers + Math.floor(Math.random() * 3 - 1)),
        aov:       jitter(prev.aov, 0.006),
        ts:        nowHMS(),
      }
      setPrevKpi(prev)
      setHistory(h => [...h.slice(-39), next])
      return next
    })

    // Randomly emit a new order (70% chance)
    if (Math.random() > 0.3) {
      const order = makeOrder()
      setOrders(prev => [order, ...prev].slice(0, 12))
      setTotalOrders(n => n + 1)
      ordersThisMin.current += 1
    }
  }, [paused])

  useEffect(() => {
    const id = setInterval(doTick, 3000)
    return () => clearInterval(id)
  }, [doTick])

  // Update OPM counter every 60 s
  useEffect(() => {
    const id = setInterval(() => {
      setOrdersPerMin(ordersThisMin.current)
      ordersThisMin.current = 0
    }, 60000)
    return () => clearInterval(id)
  }, [])

  // Simulate ws connect/disconnect toggle for demo
  useEffect(() => {
    const id = setInterval(() => {
      setConnected(c => {
        // Very rarely "disconnect" for 2 s
        if (c && Math.random() > 0.97) {
          setTimeout(() => setConnected(true), 2000)
          return false
        }
        return c
      })
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const sparkRevenue   = useMemo(() => history.slice(-15).map(h => h.revenue),   [history])
  const sparkOrders    = useMemo(() => history.slice(-15).map(h => h.orders),    [history])
  const sparkCustomers = useMemo(() => history.slice(-15).map(h => h.customers), [history])
  const sparkAOV       = useMemo(() => history.slice(-15).map(h => h.aov),       [history])

  const chartData = useMemo(() =>
    history.slice(-25).map(h => ({
      ts:      h.ts,
      revenue: Math.round(h.revenue),
      orders:  h.orders,
    })),
    [history]
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
              style={{ boxShadow: "0 0 20px rgba(52,211,153,0.4)" }}>
              <Activity className="size-4 text-white" />
            </div>
            Live Data
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time KPI stream — updates every 3 seconds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Connection status */}
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
            connected
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {connected
              ? <><Wifi className="size-3.5" /> Connected<span className="size-1.5 rounded-full bg-emerald-400 animate-pulse inline-block ml-1" /></>
              : <><WifiOff className="size-3.5" /> Reconnecting…</>
            }
          </div>

          {/* Pause / Resume */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            onClick={() => setPaused(p => !p)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
              paused
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            {paused ? "Resume" : "Pause"}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Stream uptime", value: "Live", color: "text-emerald-400" },
          { label: "Orders this session", value: totalOrders.toLocaleString(), color: "text-indigo-400" },
          { label: "Orders / min", value: ordersPerMin || "< 1", color: "text-violet-400" },
          { label: "Tick interval", value: paused ? "Paused" : "3s", color: paused ? "text-amber-400" : "text-cyan-400" },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl px-4 py-3">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className={`text-base font-bold mt-0.5 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}   label="Live Revenue"
          value={kpi.revenue} prevValue={prevKpi.revenue}
          formatter={n => formatCurrency(Math.round(n))}
          color="bg-indigo-500"   glow="rgba(99,102,241,0.5)"
          sparkline={sparkRevenue}   sparkColor="#818cf8"
        />
        <KPICard
          icon={ShoppingCart} label="Live Orders"
          value={kpi.orders}  prevValue={prevKpi.orders}
          formatter={n => formatNumber(Math.round(n))}
          color="bg-violet-500"   glow="rgba(139,92,246,0.5)"
          sparkline={sparkOrders}   sparkColor="#a78bfa"
        />
        <KPICard
          icon={Users}        label="Live Customers"
          value={kpi.customers} prevValue={prevKpi.customers}
          formatter={n => formatNumber(Math.round(n))}
          color="bg-cyan-500"     glow="rgba(6,182,212,0.5)"
          sparkline={sparkCustomers} sparkColor="#22d3ee"
        />
        <KPICard
          icon={TrendingUp}   label="Live AOV"
          value={kpi.aov}     prevValue={prevKpi.aov}
          formatter={n => formatCurrency(Math.round(n))}
          color="bg-emerald-500"  glow="rgba(52,211,153,0.5)"
          sparkline={sparkAOV}    sparkColor="#34d399"
        />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revenue stream */}
        <motion.div layout className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-4 text-indigo-400" />
            <h2 className="font-semibold text-sm">Revenue Stream</h2>
            {!paused && <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse ml-auto" />}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="ts" tick={{ fontSize: 9, fill: tick }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: tick }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltip} formatter={v => [formatCurrency(Number(v)), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2}
                fill="url(#revGrad)" dot={false} animationDuration={300} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Orders stream */}
        <motion.div layout className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="size-4 text-violet-400" />
            <h2 className="font-semibold text-sm">Order Volume Stream</h2>
            {!paused && <span className="size-1.5 rounded-full bg-violet-400 animate-pulse ml-auto" />}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="ts" tick={{ fontSize: 9, fill: tick }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: tick }} />
              <Tooltip contentStyle={tooltip} />
              <Line type="monotone" dataKey="orders" stroke="#a78bfa" strokeWidth={2}
                dot={false} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Live order feed ──────────────────────────────────────────────── */}
      <motion.div layout className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-emerald-400" />
            <h2 className="font-semibold text-sm">Live Order Feed</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
              {orders.length} recent
            </span>
          </div>
          {!paused && <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />}
        </div>

        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors ${
                  i === 0 && !paused ? "bg-indigo-500/5" : ""
                }`}
              >
                {/* Order ID */}
                <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">{order.id}</span>

                {/* Customer */}
                <div className="size-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {order.customer[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{order.customer}</div>
                  <div className="text-xs text-muted-foreground truncate">{order.product}</div>
                </div>

                {/* Category */}
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${CAT_COLOR[order.category] ?? "bg-muted text-muted-foreground"}`}>
                  {order.category}
                </span>

                {/* Amount */}
                <span className="text-sm font-bold text-emerald-400 shrink-0 w-16 text-right">
                  ${order.amount}
                </span>

                {/* Time */}
                <span className="text-[11px] text-muted-foreground shrink-0 w-16 text-right">{order.ts}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Paused overlay hint */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-semibold shadow-2xl backdrop-blur-md z-40"
          >
            <Pause className="size-4" />
            Stream paused — click Resume to continue
            <button
              onClick={() => setPaused(false)}
              className="ml-2 flex items-center gap-1 text-xs bg-amber-500/20 px-2.5 py-1 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <Play className="size-3" /> Resume
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
