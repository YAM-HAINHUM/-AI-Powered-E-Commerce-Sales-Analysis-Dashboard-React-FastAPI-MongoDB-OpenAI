import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  UserX, RefreshCw, Loader2, Info, Search, HelpCircle,
  AlertCircle, AlertTriangle, ShieldAlert
} from "lucide-react"
import { advancedApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

export default function ChurnPage() {
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState<string>("All")

  // Fetch churn predictions
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["churn-prediction"],
    queryFn: () => advancedApi.churn().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })

  // Filtered customer risk list
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

    // Apply risk filter
    if (riskFilter !== "All") {
      list = list.filter((c: any) => c.risk_badge === riskFilter)
    }

    return list
  }, [data, search, riskFilter])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full gap-3">
        <Loader2 className="size-8 text-rose-400 animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Running churn risk regression models...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          <HelpCircle className="size-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Churn Analysis Failure</div>
            <div className="text-xs text-rose-400/70 mt-0.5">Could not fetch churn prediction data. Check the backend server connection.</div>
          </div>
        </div>
      </div>
    )
  }

  const { summary = {} } = data

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
            <UserX className="size-6 text-rose-400" /> Churn Prediction
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-based prediction models that flag users who are likely to leave and discontinue purchasing
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

      {/* Risk Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Average Churn Risk</div>
          <div className="text-2xl font-bold mt-1 text-slate-200">{summary.average_churn_probability}%</div>
          <div className="text-[10px] text-indigo-400 font-medium mt-1 flex items-center gap-1">
            Average across user database
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">High Risk Buyers</div>
          <div className="text-2xl font-bold mt-1 text-rose-400">{summary.high_risk_count}</div>
          <div className="text-[10px] text-rose-400 font-medium mt-1 flex items-center gap-1">
            <AlertCircle className="size-3" /> Churn probability &gt; 70%
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Medium Risk Buyers</div>
          <div className="text-2xl font-bold mt-1 text-amber-400">{summary.medium_risk_count}</div>
          <div className="text-[10px] text-amber-400 font-medium mt-1 flex items-center gap-1">
            <AlertTriangle className="size-3" /> Churn probability 40-70%
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">At-Risk Ratio</div>
          <div className="text-2xl font-bold mt-1 text-indigo-300">{summary.at_risk_ratio_pct}%</div>
          <div className="w-full bg-white/[0.04] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${summary.at_risk_ratio_pct}%` }} />
          </div>
        </div>
      </div>

      {/* Main Customers Risk Table */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/[0.05] pb-3 shrink-0">
          <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="size-4 text-rose-400 animate-pulse" /> Customer Risk Directory
          </span>
          
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

            {/* Churn risk selector */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-white/5 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All">All Risks</option>
              <option value="high">High Churn Risk</option>
              <option value="medium">Medium Churn Risk</option>
              <option value="low">Low Churn Risk</option>
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
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Total Spent</th>
                <th className="px-4 py-2">Churn Probability</th>
                <th className="px-3 py-2 text-center">Risk level</th>
                <th className="px-3 py-2">Primary Churn Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-400">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 font-medium">No matching customers found.</td>
                </tr>
              ) : (
                filteredCustomers.map((c: any) => {
                  const badgeColor = c.risk_badge === "high" ? "text-rose-400 bg-rose-500/10 border-rose-500/25" : c.risk_badge === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/25" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                  const barColor = c.risk_badge === "high" ? "bg-rose-500" : c.risk_badge === "medium" ? "bg-amber-500" : "bg-emerald-500"
                  return (
                    <tr key={c.customer_id} className="hover:bg-white/2 bg-transparent transition-colors">
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{c.customer_id}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-200">{c.name}</td>
                      <td className="px-3 py-2.5">{c.city}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{c.frequency}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-200">{formatCurrency(c.total_spent)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="font-bold w-9 text-right">{c.churn_probability}%</span>
                          <div className="w-20 bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${c.churn_probability}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                          {c.risk_badge}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 italic text-[11px] truncate max-w-[200px]">{c.reason}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
