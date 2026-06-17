import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Users, Sparkles, RefreshCw, Loader2, Info, Search, HelpCircle,
  TrendingUp, Calendar, DollarSign
} from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { advancedApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

const TOOLTIP_STYLE = { background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e2e8f0", fontSize: 11 }

export default function SegmentsPage() {
  const [search, setSearch] = useState("")
  const [filterSegment, setFilterSegment] = useState<string>("All")

  // Fetch segments
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["customer-segments"],
    queryFn: () => advancedApi.segments().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })

  // Format Recharts data for the segment distribution pie chart
  const pieData = useMemo(() => {
    if (!data || !data.segment_summary) return []
    return data.segment_summary.map((s: any) => ({
      name: s.segment,
      value: s.count,
      color: s.color,
      revenue: s.total_revenue
    }))
  }, [data])

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!data || !data.customers) return []
    
    let list = data.customers || []
    
    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c: any) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.customer_id.toLowerCase().includes(q)
      )
    }

    // Apply segment filter
    if (filterSegment !== "All") {
      list = list.filter((c: any) => c.segment === filterSegment)
    }

    return list
  }, [data, search, filterSegment])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full gap-3">
        <Loader2 className="size-8 text-indigo-400 animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Running K-Means RFM clustering models...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          <HelpCircle className="size-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Segmentation Failure</div>
            <div className="text-xs text-rose-400/70 mt-0.5">Could not fetch customer segments. Verify the backend service.</div>
          </div>
        </div>
      </div>
    )
  }

  const { segment_summary = [], total_customers = 0 } = data

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
            <Users className="size-6 text-indigo-400" /> Customer Segments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            K-Means clustering categorizes buyers by Recency, Frequency, and Monetary spend patterns
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

      {/* Cohort summaries grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {segment_summary.map((seg: any, idx: number) => (
          <div
            key={idx}
            className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40 relative overflow-hidden group"
          >
            {/* Left accent color strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: seg.color }} />
            
            <div className="text-xs text-slate-500 font-semibold uppercase">{seg.segment}</div>
            <div className="text-2xl font-black mt-2 text-slate-200">
              {seg.count} <span className="text-xs text-slate-500 font-medium">buyers ({seg.pct_of_customers}%)</span>
            </div>
            
            <div className="mt-3.5 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Total Spend:</span>
                <span className="font-bold text-slate-300">{formatCurrency(seg.total_revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Recency:</span>
                <span className="font-medium">{seg.avg_recency_days} days ago</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribution Pie Chart & Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 lg:col-span-1 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-slate-300 mb-2">Segment Proportions</h3>
          <div className="w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {pieData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val: any, name: any, props: any) => [
                    `${val} buyers (${formatCurrency(props.payload.revenue)} total)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-medium">
            {pieData.map((d: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="truncate">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature definitions and insights */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3 shrink-0">
            <Sparkles className="size-4 text-indigo-400" />
            <span className="font-bold text-sm text-slate-200">Segment Behavior Analytics</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <Calendar className="size-4.5 text-indigo-400" />
              <div className="font-semibold text-slate-300">Recency (R)</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Interval since customer last checked out. Smaller gaps trigger higher engagement scores.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <TrendingUp className="size-4.5 text-violet-400" />
              <div className="font-semibold text-slate-300">Frequency (F)</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Total checkout transactions processed. Demonstrates consistency and brand familiarity.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <DollarSign className="size-4.5 text-emerald-400" />
              <div className="font-semibold text-slate-300">Monetary (M)</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Aggregated cash volume spent. Guides customer lifetime value thresholds.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-xs text-indigo-200 leading-relaxed">
            💡 **High-Value Cohort Insight**: Represents your premium shoppers contributing a disproportionate amount of store sales. Ensure these buyers are enrolled in targeted early-access catalogs. Offer loyalty bonuses on the next purchase.
          </div>
        </div>

      </div>

      {/* Customer details checklist table */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/[0.05] pb-3 shrink-0">
          <span className="font-bold text-sm text-slate-200">Cohort Member List</span>
          
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Search */}
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 outline-none text-slate-300 placeholder-slate-600 min-w-[180px] pr-8"
              />
              <Search className="size-3.5 absolute right-2.5 top-2.5 text-slate-600" />
            </div>

            {/* Segment select filter */}
            <select
              value={filterSegment}
              onChange={(e) => setFilterSegment(e.target.value)}
              className="bg-slate-950 border border-white/5 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All">All Cohorts</option>
              {segment_summary.map((s: any) => (
                <option key={s.segment} value={s.segment}>{s.segment}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hidden">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-white/5">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Customer Name</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2 text-right">Recency (Days)</th>
                <th className="px-3 py-2 text-right">Frequency (Orders)</th>
                <th className="px-3 py-2 text-right">Monetary Spend</th>
                <th className="px-3 py-2 text-center">Assigned Segment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-400">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 font-medium">No matching customers found.</td>
                </tr>
              ) : (
                filteredCustomers.map((c: any, index: number) => (
                  <tr key={c.customer_id} className="hover:bg-white/2 bg-transparent transition-colors">
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{c.customer_id}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-200">{c.name}</td>
                    <td className="px-3 py-2.5">{c.city}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{c.recency} d</td>
                    <td className="px-3 py-2.5 text-right font-medium">{c.frequency}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-200">{formatCurrency(c.monetary)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/5 text-white" style={{ backgroundColor: `${c.color}20`, borderColor: `${c.color}35`, color: c.color }}>
                        {c.segment}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
