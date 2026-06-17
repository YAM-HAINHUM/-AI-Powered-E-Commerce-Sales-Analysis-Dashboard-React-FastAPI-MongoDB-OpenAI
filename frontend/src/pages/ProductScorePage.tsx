import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Star, RefreshCw, Loader2, Info, Search, HelpCircle,
  TrendingUp, BarChart2, ShieldAlert
} from "lucide-react"
import { advancedApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

export default function ProductScorePage() {
  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("All")

  // Fetch product scores
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["product-scores"],
    queryFn: () => advancedApi.productScore().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })

  // Filtered product score list
  const filteredProducts = useMemo(() => {
    if (!data || !data.products) return []
    
    let list = data.products || []
    
    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p: any) =>
        p.product_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.product_id.toLowerCase().includes(q)
      )
    }

    // Apply grade filter
    if (gradeFilter !== "All") {
      list = list.filter((p: any) => p.grade === gradeFilter)
    }

    return list
  }, [data, search, gradeFilter])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full gap-3">
        <Loader2 className="size-8 text-amber-400 animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Calculating product performance matrices...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          <HelpCircle className="size-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Performance scoring failed</div>
            <div className="text-xs text-rose-400/70 mt-0.5">Could not fetch product scores. Verify the backend connection.</div>
          </div>
        </div>
      </div>
    )
  }

  const { summary = {} } = data
  const dist = summary.grade_distribution || {}

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
            <Star className="size-6 text-amber-400" /> Product Performance Score
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Evaluates products (0–100, Grade A–D) based on sales velocity, revenue share, return rates, and customer reviews
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

      {/* Summary stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Average Performance Score</div>
          <div className="text-2xl font-bold mt-1 text-slate-200">{summary.average_score}</div>
          <div className="text-[10px] text-indigo-400 font-medium mt-1">
            Median baseline standard
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40 col-span-2">
          <div className="text-xs text-slate-500 font-medium mb-1.5">Grade Distribution</div>
          <div className="flex items-center gap-5">
            {["A", "B", "C", "D"].map(g => {
              const colors = g === "A" ? "text-emerald-400" : g === "B" ? "text-indigo-400" : g === "C" ? "text-amber-400" : "text-rose-400"
              return (
                <div key={g} className="flex flex-col">
                  <span className={`text-md font-bold ${colors}`}>Grade {g}</span>
                  <span className="text-xs text-slate-300">{dist[g] || 0} product{(dist[g] || 0) !== 1 ? "s" : ""}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
          <div className="text-xs text-slate-500 font-medium">Top Performer (A)</div>
          <div className="text-sm font-bold mt-1.5 text-emerald-400 truncate">{summary.top_product}</div>
          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
            Highest combined indexing metrics
          </div>
        </div>
      </div>

      {/* Main product score list */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/[0.05] pb-3 shrink-0">
          <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="size-4 text-amber-400 animate-pulse" /> Product Score Matrix
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

            {/* Grade filter selector */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-slate-950 border border-white/5 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All">All Grades</option>
              <option value="A">Grade A (Excellent)</option>
              <option value="B">Grade B (Good)</option>
              <option value="C">Grade C (Average)</option>
              <option value="D">Grade D (Poor)</option>
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
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Units Sold</th>
                <th className="px-3 py-2 text-right">Total Revenue</th>
                <th className="px-3 py-2 text-right">Reviews</th>
                <th className="px-3 py-2 text-right">Return Rate</th>
                <th className="px-4 py-2 text-center">Score</th>
                <th className="px-3 py-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-400">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 font-medium">No matching products found.</td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => {
                  const gradeColor = p.grade === "A" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : p.grade === "B" ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/25" : p.grade === "C" ? "text-amber-400 bg-amber-500/10 border-amber-500/25" : "text-rose-400 bg-rose-500/10 border-rose-500/25"
                  const barColor = p.grade === "A" ? "bg-emerald-500" : p.grade === "B" ? "bg-indigo-500" : p.grade === "C" ? "bg-amber-500" : "bg-rose-500"
                  return (
                    <tr key={p.product_id} className="hover:bg-white/2 bg-transparent transition-colors">
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{p.product_id}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-200">{p.product_name}</td>
                      <td className="px-3 py-2.5">{p.category}</td>
                      <td className="px-3 py-2.5 text-right font-medium">${p.price}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{p.units_sold}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-200">{formatCurrency(p.revenue)}</td>
                      <td className="px-3 py-2.5 text-right text-amber-400 font-medium">{p.rating} ★</td>
                      <td className="px-3 py-2.5 text-right text-rose-400 font-medium">{p.return_rate_pct}%</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold w-6">{p.performance_score}</span>
                          <div className="w-12 bg-white/[0.04] h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p.performance_score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded border uppercase ${gradeColor}`}>
                          {p.grade}
                        </span>
                      </td>
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
