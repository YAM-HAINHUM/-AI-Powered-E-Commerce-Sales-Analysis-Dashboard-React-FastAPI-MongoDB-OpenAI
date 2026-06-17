import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { advancedApi } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
  TrendingUp, AlertTriangle, Users, BookOpen, Download,
  RefreshCw, Award, PieChart as PieIcon, LineChart as LineIcon, Activity
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ZAxis
} from "recharts"
import { motion } from "framer-motion"

import { useTheme } from "@/components/theme-provider"

const COLORS = ["#34d399", "#818cf8", "#fbbf24", "#f87171"]

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return {
    tooltip: dark
      ? { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }
      : { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    tick: dark ? "#94a3b8" : "#64748b",
    grid: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
  }
}

export default function AdvancedAnalyticsPage() {
  const { tooltip: tooltipStyle, tick, grid } = useChartTheme()
  const [forecastTab, setForecastTab] = useState<"7d" | "30d">("7d")
  const [downloading, setDownloading] = useState(false)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: forecastData, isLoading: forecastLoading, refetch: refetchForecast } = useQuery({
    queryKey: ["advanced", "forecast"],
    queryFn: () => advancedApi.forecast().then(res => res.data)
  })

  const { data: anomalyData, isLoading: anomalyLoading, refetch: refetchAnomaly } = useQuery({
    queryKey: ["advanced", "anomaly"],
    queryFn: () => advancedApi.anomaly().then(res => res.data)
  })

  const { data: segmentationData, isLoading: segmentationLoading, refetch: refetchSegmentation } = useQuery({
    queryKey: ["advanced", "segmentation"],
    queryFn: () => advancedApi.segmentation().then(res => res.data)
  })

  const { data: clvData, isLoading: clvLoading, refetch: refetchCLV } = useQuery({
    queryKey: ["advanced", "clv"],
    queryFn: () => advancedApi.clv().then(res => res.data)
  })

  const { data: cohortData, isLoading: cohortLoading, refetch: refetchCohort } = useQuery({
    queryKey: ["advanced", "cohort"],
    queryFn: () => advancedApi.cohort().then(res => res.data)
  })

  const { data: recommendationData, isLoading: recsLoading, refetch: refetchRecs } = useQuery({
    queryKey: ["advanced", "recommendation"],
    queryFn: () => advancedApi.recommendation().then(res => res.data)
  })

  const handleDownloadReport = async () => {
    setDownloading(true)
    try {
      const response = await advancedApi.downloadReport()
      const blob = new Blob([response.data], { type: "application/pdf" })
      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      link.download = "ecommerce_executive_report.pdf"
      link.click()
    } catch (error) {
      console.error("Failed to download PDF report", error)
    } finally {
      setDownloading(false)
    }
  }

  const handleRefreshAll = () => {
    refetchForecast()
    refetchAnomaly()
    refetchSegmentation()
    refetchCLV()
    refetchCohort()
    refetchRecs()
  }

  const isLoading = forecastLoading || anomalyLoading || segmentationLoading || clvLoading || cohortLoading || recsLoading

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted/50 animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-muted/50 animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-80 bg-muted/20 animate-pulse p-6" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-96 bg-muted/20 animate-pulse p-6" />
          ))}
        </div>
      </div>
    )
  }

  // Process data for Forecast line comparison
  const forecastSeries = forecastTab === "7d" ? forecastData?.next_7_days : forecastData?.next_30_days
  const combinedForecastChart = [
    ...(forecastData?.historical_30_days || []).map((x: any) => ({ ...x, label: "Actual" })),
    ...(forecastSeries || []).map((x: any) => ({ ...x, label: "Forecast" }))
  ]

  // Process scatter data for Customer segments mapping
  // Map Recency vs Monetary to visualize clusters
  const scatterPoints = (segmentationData?.customers || []).map((c: any) => ({
    name: c.name,
    x: c.recency,
    y: c.monetary,
    z: c.frequency,
    segment: c.segment,
    color: c.color
  }))

  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text-static">
            Advanced AI Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Predictive forecasting, clustering models, and real-time operational diagnostics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm font-semibold hover:bg-muted hover:border-border transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            <Download className="size-4" /> {downloading ? "Generating..." : "Download PDF Report"}
          </button>
          <button
            onClick={handleRefreshAll}
            className="flex items-center justify-center p-2.5 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-all cursor-pointer shadow-lg"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Anomaly Alerts Section */}
      {anomalyData?.anomalies?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-rose-500/20 bg-rose-950/10 backdrop-blur-md p-5 flex items-start gap-4"
        >
          <AlertTriangle className="size-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-rose-200">AI Anomaly Alerts</h3>
            <div className="mt-2 space-y-2 max-h-24 overflow-y-auto pr-2">
              {anomalyData.anomalies.map((anomaly: any, idx: number) => (
                <div key={idx} className="text-sm text-rose-300 flex justify-between items-center bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-500/10">
                  <span>{anomaly.alert}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${
                    anomaly.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                  }`}>{anomaly.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Row 1: Forecast & Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Forecasting */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 backdrop-blur-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Revenue Forecasting</h2>
            </div>
            <div className="flex bg-slate-900 rounded-lg p-1">
              <button
                onClick={() => setForecastTab("7d")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  forecastTab === "7d" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setForecastTab("30d")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  forecastTab === "30d" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedForecastChart}>
                <defs>
                  <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="forecastColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: tick }} />
                <YAxis tick={{ fontSize: 10, fill: tick }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatCurrency(Number(val)), "Revenue"]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" name="Actual Revenue" dataKey="revenue" stroke="#818cf8" fillOpacity={1} fill="url(#actualColor)" strokeWidth={2} />
                <Area type="monotone" name="AI Forecasted" dataKey="revenue" stroke="#a78bfa" fillOpacity={1} fill="url(#forecastColor)" strokeDasharray="4 4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
            <span>Model: <b>{forecastData?.summary?.model}</b></span>
            <span>Confidence Level: <b className="text-emerald-400">{forecastData?.summary?.confidence}%</b></span>
            <span>Growth prediction: <b className="text-indigo-400">+{forecastData?.summary?.growth_pct}%</b></span>
          </div>
        </div>

        {/* Customer Segmentation */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 backdrop-blur-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Customer Clusters (K-Means)</h2>
            </div>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full font-semibold">
              RFM Metrics Model
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis type="number" dataKey="x" name="Recency" unit=" days" tick={{ fontSize: 10, fill: tick }} label={{ value: 'Recency (Days Inactive)', position: 'insideBottom', offset: -5, fill: tick, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="Monetary" unit="$" tick={{ fontSize: 10, fill: tick }} label={{ value: 'Monetary Spend ($)', angle: -90, position: 'insideLeft', fill: tick, fontSize: 10 }} />
                <ZAxis type="number" dataKey="z" range={[40, 400]} name="Orders" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {segmentationData?.segment_summary?.map((seg: any, idx: number) => (
                  <Scatter
                    key={seg.segment}
                    name={seg.segment}
                    data={scatterPoints.filter(p => p.segment === seg.segment)}
                    fill={seg.color}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {segmentationData?.segment_summary?.map((seg: any) => (
              <div key={seg.segment} className="p-2 rounded-xl bg-muted/30 border border-border">
                <div className="text-[10px] text-slate-400 truncate">{seg.segment}</div>
                <div className="font-bold text-sm" style={{ color: seg.color }}>{seg.pct_of_customers}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Customer Lifetime Value & Retention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Lifetime Value (CLV) */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 backdrop-blur-lg">
          <div className="flex items-center gap-2 mb-6">
            <Award className="size-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Lifetime Value Tiers (CLV)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <div className="text-xs text-slate-400">Average Customer CLV</div>
                <div className="text-3xl font-extrabold text-white mt-1">
                  {formatCurrency(clvData?.summary?.avg_clv || 0)}
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Platinum", count: clvData?.summary?.platinum_count, color: "#34d399" },
                  { name: "Gold", count: clvData?.summary?.gold_count, color: "#818cf8" },
                  { name: "Silver", count: clvData?.summary?.silver_count, color: "#fbbf24" },
                  { name: "Bronze", count: clvData?.summary?.bronze_count, color: "#f87171" }
                ].map((tier) => (
                  <div key={tier.name} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span className="font-semibold text-slate-300">{tier.name} Tier</span>
                    </span>
                    <span className="font-bold text-white">{tier.count || 0} customers</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Plat", value: clvData?.summary?.platinum_count || 0 },
                  { name: "Gold", value: clvData?.summary?.gold_count || 0 },
                  { name: "Silv", value: clvData?.summary?.silver_count || 0 },
                  { name: "Bronz", value: clvData?.summary?.bronze_count || 0 }
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: tick }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="#34d399" />
                    <Cell fill="#818cf8" />
                    <Cell fill="#fbbf24" />
                    <Cell fill="#f87171" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cohort Retention Table */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 backdrop-blur-lg">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="size-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white">Cohort Retention Grid</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400">
                  <th className="py-2.5 font-bold">Cohort Month</th>
                  <th className="py-2.5 font-bold text-center">Customers</th>
                  <th className="py-2.5 font-bold text-center">Month 0</th>
                  <th className="py-2.5 font-bold text-center">Month 1</th>
                  <th className="py-2.5 font-bold text-center">Month 2</th>
                  <th className="py-2.5 font-bold text-center">Month 3</th>
                  <th className="py-2.5 font-bold text-center">Month 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cohortData?.cohorts?.map((row: any) => (
                  <tr key={row.cohort} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-semibold text-slate-300">{row.cohort}</td>
                    <td className="py-3 text-center text-slate-400 font-bold">{row.size}</td>
                    {[0, 1, 2, 3, 4].map((mIdx) => {
                      const rate = row.retention[`month_${mIdx}`]
                      return (
                        <td
                          key={mIdx}
                          className="py-3 text-center font-bold transition-colors"
                          style={{
                            backgroundColor: rate ? `rgba(99, 102, 241, ${rate / 150})` : 'transparent',
                            color: rate && rate > 50 ? '#ffffff' : '#94a3b8'
                          }}
                        >
                          {rate !== undefined ? `${rate}%` : '-'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Product co-purchase recommendation rules */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 backdrop-blur-lg">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="size-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">AI Co-Purchase Engine ("Frequently Bought Together")</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3">Top Product Pairs (Market Basket Analysis)</h3>
            <div className="space-y-2.5">
              {recommendationData?.top_pairs?.slice(0, 5).map((pair: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">{idx + 1}</span>
                      <span className="truncate">{pair.product_a}</span>
                      <span className="text-slate-500 font-normal">+</span>
                      <span className="truncate">{pair.product_b}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <div className="font-bold text-indigo-300">{pair.co_purchases} co-purchases</div>
                    <div className="text-slate-500">Lift: <b>{pair.lift}x</b></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3">Key Recommendations</h3>
            <div className="space-y-3.5">
              {[
                { title: "Bundle Strategy", desc: "Bundle Electronics accessories with high-selling primary devices to improve Average Order Value.", target: "Target Lift: 2.5x+" },
                { title: "Cross-Selling Rule", desc: "Display related products in checkout cart when confidence match score is high (above 0.35).", target: "Estimated Revenue: +$1,200/mo" }
              ].map((rec, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-indigo-500/10 bg-indigo-950/5">
                  <div className="font-bold text-sm text-indigo-300">{rec.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{rec.desc}</div>
                  <div className="text-xs text-emerald-400 font-bold mt-2">{rec.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
