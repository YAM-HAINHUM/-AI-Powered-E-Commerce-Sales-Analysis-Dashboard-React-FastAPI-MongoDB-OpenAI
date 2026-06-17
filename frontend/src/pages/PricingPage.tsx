import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  DollarSign, RefreshCw, Loader2, Info, Search, HelpCircle,
  TrendingUp, TrendingDown, Percent, Scale
} from "lucide-react"
import { advancedApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

export default function PricingPage() {
  const [search, setSearch] = useState("")
  const [elasticityFilter, setElasticityFilter] = useState<string>("All")

  // Fetch pricing suggestions
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["pricing-suggestions"],
    queryFn: () => advancedApi.pricing().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })

  // Filtered pricing suggestions list
  const filteredSuggestions = useMemo(() => {
    if (!data || !data.recommendations) return []
    
    let list = data.recommendations || []
    
    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p: any) =>
        p.product_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.product_id.toLowerCase().includes(q)
      )
    }

    // Apply elasticity filter
    if (elasticityFilter !== "All") {
      list = list.filter((p: any) => p.elasticity === elasticityFilter)
    }

    return list
  }, [data, search, elasticityFilter])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full gap-3">
        <Loader2 className="size-8 text-emerald-400 animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Running dynamic price elasticity optimization calculations...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          <HelpCircle className="size-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Pricing engine failed</div>
            <div className="text-xs text-rose-400/70 mt-0.5">Could not fetch dynamic pricing suggestions. Verify the backend service.</div>
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
            <DollarSign className="size-6 text-emerald-400" /> Dynamic Pricing AI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Machine learning suggestions recommending markdowns or markups based on purchasing demand speed
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

      {/* Pricing Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Estimated Monthly Gain</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">+{formatCurrency(summary.expected_monthly_revenue_gain)}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            If all optimizations are active
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Markdown Revisions</div>
          <div className="text-2xl font-bold mt-1 text-rose-400">{summary.markdown_suggestions} items</div>
          <div className="text-[10px] text-rose-400/80 font-medium mt-1 flex items-center gap-1">
            <TrendingDown className="size-3" /> Price cuts to clear inventory
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Markup Revisions</div>
          <div className="text-2xl font-bold mt-1 text-indigo-300">{summary.markup_suggestions} items</div>
          <div className="text-[10px] text-indigo-300/80 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="size-3" /> Margin captures on high-demand
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Stable Pricing</div>
          <div className="text-2xl font-bold mt-1 text-slate-400">{summary.no_change_suggestions} items</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            Optimal price points stabilized
          </div>
        </div>
      </div>

      {/* Main Pricing Table */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/[0.05] pb-3 shrink-0">
          <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
            <Scale className="size-4.5 text-emerald-400 animate-pulse" /> Optimization Grid
          </span>
          
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Search */}
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 outline-none text-slate-300 placeholder-slate-600 min-w-[180px] pr-8"
              />
              <Search className="size-3.5 absolute right-2.5 top-2.5 text-slate-600" />
            </div>

            {/* Elasticity dropdown */}
            <select
              value={elasticityFilter}
              onChange={(e) => setElasticityFilter(e.target.value)}
              className="bg-slate-950 border border-white/5 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All">All Elasticities</option>
              <option value="High">High Elasticity (Price Sensitive)</option>
              <option value="Medium">Medium Elasticity</option>
              <option value="Low">Low Elasticity (Price Inelastic)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hidden">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-white/5">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Product Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Units</th>
                <th className="px-3 py-2 text-right">Current Price</th>
                <th className="px-3 py-2 text-right">Suggested Price</th>
                <th className="px-3 py-2 text-center">Change %</th>
                <th className="px-3 py-2 text-center">Elasticity</th>
                <th className="px-3 py-2 text-right">Expected Monthly Gain</th>
                <th className="px-3 py-2">Optimization Strategy Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-400">
              {filteredSuggestions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 font-medium">No matching items found.</td>
                </tr>
              ) : (
                filteredSuggestions.map((s: any) => {
                  const changeColor = s.change_pct < 0 ? "text-rose-400 bg-rose-500/10" : s.change_pct > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 bg-slate-500/10"
                  const elasticityColor = s.elasticity === "High" ? "text-rose-400 border-rose-500/25" : s.elasticity === "Low" ? "text-emerald-400 border-emerald-500/25" : "text-amber-400 border-amber-500/25"
                  return (
                    <tr key={s.product_id} className="hover:bg-white/2 bg-transparent transition-colors">
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{s.product_id}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-200">{s.product_name}</td>
                      <td className="px-3 py-2.5">{s.category}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{s.units_sold}</td>
                      <td className="px-3 py-2.5 text-right font-medium">${s.price}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-200">${s.suggested_price}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${changeColor}`}>
                          {s.change_pct < 0 ? "" : s.change_pct > 0 ? "+" : ""}{s.change_pct}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${elasticityColor}`}>
                          {s.elasticity} Elasticity
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-400">+{formatCurrency(s.expected_gain)}/mo</td>
                      <td className="px-3 py-2.5 text-slate-300 italic text-[11px] max-w-[200px] truncate">{s.reason}</td>
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
