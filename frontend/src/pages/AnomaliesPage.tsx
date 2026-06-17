import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  AlertTriangle, AlertCircle, TrendingUp, TrendingDown, RefreshCw,
  Loader2, Info, CheckCircle2, ShieldAlert
} from "lucide-react"
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Scatter, Legend
} from "recharts"
import { advancedApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

const TOOLTIP_STYLE = { background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e2e8f0", fontSize: 11 }

export default function AnomaliesPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["sales-anomalies"],
    queryFn: () => advancedApi.anomalies().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })

  // Format Recharts data mapping anomalies on top of daily sales
  const chartData = useMemo(() => {
    if (!data) return []

    const daily = data.all_daily || []
    const anomalies = data.anomalies || []
    const anomalyMap = new Map(anomalies.map((a: any) => [a.date, a]))

    return daily.map((d: any) => {
      const anom = anomalyMap.get(d.date)
      return {
        name: d.date,
        Sales: d.revenue,
        // Separate series for scatter plot markers
        Spike: anom && anom.direction === "spike" ? d.revenue : null,
        Drop: anom && anom.direction === "drop" ? d.revenue : null,
        anomalyInfo: anom || null
      }
    })
  }, [data])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full gap-3">
        <Loader2 className="size-8 text-violet-400 animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Running statistical anomaly detectors...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          <Info className="size-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Anomaly Analysis Failed</div>
            <div className="text-xs text-rose-400/70 mt-0.5">Could not fetch anomalies. Verify the backend is reachable.</div>
          </div>
        </div>
      </div>
    )
  }

  const { anomalies, summary } = data

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
            <AlertTriangle className="size-6 text-amber-400" /> Anomaly Detection
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Statistical deviation monitoring showing unusual sales spikes or drops
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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Total Flagged Days</div>
          <div className="text-2xl font-bold mt-1 text-slate-200">{summary.total_anomalies}</div>
          <div className="text-[10px] text-amber-400 font-medium mt-1 flex items-center gap-1">
            <AlertTriangle className="size-3" /> Z-Score Outliers
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Critical Alerts</div>
          <div className="text-2xl font-bold mt-1 text-rose-400">{summary.critical_count}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Deviations greater than 3 std dev
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Mean Daily Revenue</div>
          <div className="text-2xl font-bold mt-1 text-indigo-300">{formatCurrency(summary.mean_daily_revenue)}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Baseline mean standard
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Status Summary</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">
            {summary.total_anomalies > 0 ? "Alerts Active" : "All Clear"}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-400" /> Baselines Stabilized
          </div>
        </div>
      </div>

      {/* Outliers Chart */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30">
        <h3 className="font-semibold text-sm mb-4">Daily Sales Outliers Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any, name: string) => {
                if (name === "Sales") return [formatCurrency(Number(v)), "Daily Sales"]
                if (name === "Spike Outlier") return [formatCurrency(Number(v)), "Positive Spike"]
                if (name === "Drop Outlier") return [formatCurrency(Number(v)), "Critical Drop"]
                return [v, name]
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            
            {/* Base Sales Line */}
            <Line
              type="monotone"
              dataKey="Sales"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              name="Sales"
              activeDot={{ r: 4 }}
            />
            {/* Positive Spike Scatter Markers */}
            <Scatter
              dataKey="Spike"
              fill="#10b981"
              shape="circle"
              name="Spike Outlier"
              legendType="circle"
            />
            {/* Negative Drop Scatter Markers */}
            <Scatter
              dataKey="Drop"
              fill="#f87171"
              shape="circle"
              name="Drop Outlier"
              legendType="circle"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Alert Feed Section */}
      <div className="space-y-3">
        <div className="font-semibold text-sm text-slate-300 flex items-center gap-2">
          <ShieldAlert className="size-4 text-rose-400" /> Active Alert Stream
        </div>

        {anomalies.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center text-slate-500 border border-white/5">
            <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-semibold">No anomalies detected in the database</p>
            <p className="text-xs mt-1">All transactional data conforms to normal baselines.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((a: any, idx: number) => {
              const isSpike = a.direction === "spike"
              const isCrit = a.severity === "critical"
              return (
                <div
                  key={idx}
                  className={`flex gap-3.5 p-4 rounded-xl border ${
                    isCrit 
                      ? "border-rose-500/20 bg-rose-500/5 text-rose-300"
                      : "border-amber-500/20 bg-amber-500/5 text-amber-300"
                  } glass-card`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCrit ? (
                      <AlertCircle className="size-5 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="size-5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span>{isSpike ? "Positive Sales Spike" : "Revenue Drop Alert"}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        isCrit ? "border-rose-500/30 text-rose-400 bg-rose-500/10" : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      }`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{a.alert}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                      <span>Date: {a.date}</span>
                      <span>Orders: {a.orders}</span>
                      <span>Z-Score: {a.z_score}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
