import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, Sparkles, Loader2, RefreshCw,
  Calendar, Target, Brain, Info
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts"
import { advancedApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

const TOOLTIP_STYLE = { background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e2e8f0", fontSize: 11 }

export default function ForecastPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")

  // Fetch forecast data
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["revenue-forecast"],
    queryFn: () => advancedApi.forecast().then((r) => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Format chart data based on selected period
  const chartData = useMemo(() => {
    if (!data) return []

    const historical = data.historical_30_days || []
    
    // Select correct forecast period
    let forecast = []
    if (period === "7d") forecast = data.next_7_days || []
    else if (period === "30d") forecast = data.next_30_days || []
    else forecast = (data.next_3_months || []).map((m: any) => ({
      date: m.month,
      revenue: m.revenue,
      type: "forecast"
    }))

    // Consolidate actual vs forecasted
    // Recharts handles multiple objects in an array. We can map them:
    const result: any[] = []
    
    // Add historical actuals
    historical.forEach((h: any) => {
      result.push({
        name: h.date,
        Actual: h.revenue,
        Forecast: null
      })
    })

    // Connect the last historical point to the first forecast point
    const lastHistorical = historical[historical.length - 1]

    // Add forecast
    forecast.forEach((f: any, idx: number) => {
      result.push({
        name: f.date || f.month,
        Actual: idx === 0 && lastHistorical ? lastHistorical.revenue : null,
        Forecast: f.revenue
      })
    })

    return result
  }, [data, period])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full gap-3">
        <Loader2 className="size-8 text-indigo-400 animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Running predictive models...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          <Info className="size-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Prediction model failed</div>
            <div className="text-xs text-rose-400/70 mt-0.5">Could not fetch forecasting data. Ensure the backend is online.</div>
          </div>
        </div>
      </div>
    )
  }

  const { summary } = data
  const isGrowth = (summary?.growth_pct ?? 0) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="size-6 text-indigo-400" /> Sales Forecasting
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Predict future e-commerce revenue using statistical trend forecasting
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Projected 30d Revenue</div>
          <div className="text-2xl font-bold mt-1 text-slate-200">{formatCurrency(summary.forecast_30d_total)}</div>
          <div className="text-[10px] text-indigo-400 font-medium mt-1 flex items-center gap-1">
            <Sparkles className="size-3 animate-pulse" /> AI Forecasted Total
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Growth Target</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold ${isGrowth ? "text-emerald-400" : "text-rose-400"}`}>
              {isGrowth ? "+" : ""}{summary.growth_pct}%
            </span>
            {isGrowth ? <TrendingUp className="size-5 text-emerald-400" /> : <TrendingDown className="size-5 text-rose-400" />}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Compared to actual last 30 days
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Confidence Score</div>
          <div className="text-2xl font-bold mt-1 text-indigo-300">{summary.confidence}%</div>
          <div className="w-full bg-white/[0.04] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${summary.confidence}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">ML Model Engine</div>
          <div className="text-2xl font-bold mt-1 text-indigo-200">{summary.model}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <Brain className="size-3" /> Regression Analysis
          </div>
        </div>
      </div>

      {/* Main Forecast Chart Card */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4.5 text-indigo-400" />
            <span className="font-semibold text-sm">Revenue Forecast & Actuals Timeline</span>
          </div>
          
          <div className="flex bg-slate-950/40 rounded-lg p-0.5 border border-white/5">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "3 Months" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  period === tab.id
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [formatCurrency(Number(v)), ""]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            
            {/* Actual sales */}
            <Area
              type="monotone"
              dataKey="Actual"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#actualGrad)"
              activeDot={{ r: 4 }}
              name="Historical Actual Sales"
            />
            {/* Forecast sales */}
            <Area
              type="monotone"
              dataKey="Forecast"
              stroke="#22d3ee"
              strokeDasharray="4 4"
              strokeWidth={2}
              fill="url(#forecastGrad)"
              activeDot={{ r: 4 }}
              name="AI Forecasted Sales"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Growth/Decline Warning Block */}
      <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40 flex items-start gap-4">
        <div className={`p-2 rounded-lg ${isGrowth ? "bg-emerald-500/10" : "bg-rose-500/10"} shrink-0`}>
          <Target className={`size-5 ${isGrowth ? "text-emerald-400" : "text-rose-400"}`} />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-sm text-slate-200">AI Forecasting Insights</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isGrowth
              ? `Revenue forecast signals a growth of +${summary.growth_pct}% over the next 30 days. Maintain high levels of inventory in top-performing categories (e.g. Electronics) and optimize delivery timelines to capture maximum conversion.`
              : `Sales trend analysis projects a decline of ${summary.growth_pct}% in monthly velocity. Recommend initiating promotional email campaigns for your high-value segment and adjusting dynamic prices on slow-moving inventory to recovery traction.`
            }
          </p>
        </div>
      </div>
    </motion.div>
  )
}
