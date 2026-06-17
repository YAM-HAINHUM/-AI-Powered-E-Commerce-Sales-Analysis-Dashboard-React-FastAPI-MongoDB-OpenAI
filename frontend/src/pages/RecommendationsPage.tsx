import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Lightbulb, Sparkles, RefreshCw, Loader2, ArrowRight,
  TrendingUp, ShoppingBag, Target, Search, BarChart3, HelpCircle
} from "lucide-react"
import { advancedApi } from "@/lib/api"
import { priorityColor } from "@/lib/utils"

export default function RecommendationsPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>("")

  // Fetch recommendations
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: () => advancedApi.recommendations().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })

  // Fetch recommendations for a single specific product when selected
  const { data: singleProductRecs, isLoading: singleLoading } = useQuery({
    queryKey: ["single-product-rec", selectedProductId],
    queryFn: () => advancedApi.recommendation(selectedProductId).then((r) => r.data),
    enabled: selectedProductId !== "",
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full gap-3">
        <Loader2 className="size-8 text-amber-400 animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Computing association rules and strategic recommendations...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          <HelpCircle className="size-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold">Recommendations engine failed</div>
            <div className="text-xs text-rose-400/70 mt-0.5">Could not fetch recommendations. Verify backend is running.</div>
          </div>
        </div>
      </div>
    )
  }

  const { smart_recommendations = [], co_purchases = {} } = data
  const { top_pairs = [], all_products = [] } = co_purchases

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
            <Lightbulb className="size-6 text-amber-400" /> AI Recommendations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Data-driven price optimizations, targeted inventory bundles, and loyalty campaign suggestions
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

      {/* Smart Recommendations Section */}
      <div className="space-y-4">
        <div className="font-semibold text-sm text-slate-300 flex items-center gap-2">
          <Sparkles className="size-4 text-violet-400" /> Strategic Business Actions
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {smart_recommendations.map((rec: any, idx: number) => {
            return (
              <div
                key={idx}
                className="flex gap-4 p-5 rounded-2xl border border-white/5 bg-slate-900/40 glass-card hover:border-indigo-500/20 transition-all duration-300 group"
              >
                <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                    priorityColor(rec.priority)
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-200 text-sm group-hover:text-amber-400 transition-colors">{rec.title}</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {rec.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                  
                  <div className="flex items-center gap-5 text-[10px] pt-1">
                    <div className="flex items-center gap-1">
                      <Target className="size-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Impact: {rec.estimated_impact}</span>
                    </div>
                    {rec.confidence && (
                      <div className="flex items-center gap-1 text-slate-400 font-medium">
                        <TrendingUp className="size-3 text-indigo-400" />
                        <span>Confidence: {rec.confidence}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Co-Purchase Analysis matrix section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top pairs matrix */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3 shrink-0">
            <BarChart3 className="size-4.5 text-indigo-400" />
            <span className="font-bold text-sm text-slate-200">Frequently Bought Together</span>
          </div>

          <div className="overflow-x-auto scrollbar-hidden">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-white/5">
                <tr>
                  <th className="px-3 py-2">Product Pair A</th>
                  <th className="px-1 text-center font-bold">and</th>
                  <th className="px-3 py-2">Product Pair B</th>
                  <th className="px-3 py-2 text-right">Orders Together</th>
                  <th className="px-3 py-2 text-right">Lift Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-400">
                {top_pairs.slice(0, 7).map((pair: any, pidx: number) => (
                  <tr key={pidx} className="hover:bg-white/2 bg-transparent transition-colors">
                    <td className="px-3 py-2.5 font-medium text-slate-300">{pair.product_a}</td>
                    <td className="px-1 text-center font-bold text-slate-600">&amp;</td>
                    <td className="px-3 py-2.5 font-medium text-slate-300">{pair.product_b}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-200">{pair.co_purchases}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-400">{pair.lift}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product specific selector recommendations */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-b-white/[0.05] pb-3 shrink-0">
            <ShoppingBag className="size-4.5 text-amber-400" />
            <span className="font-bold text-sm text-slate-200">Affiliation Queries by Product</span>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-slate-500 font-medium">Select a product to view related purchasing affinity:</label>
            <div className="relative">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs bg-[#0d1424] border border-white/[0.08] rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
              >
                <option value="">— Select Product —</option>
                {all_products.map((p: any) => (
                  <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.category})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-3 text-slate-500">
                <Search className="size-4" />
              </div>
            </div>
          </div>

          {/* Single product recs results list */}
          <div className="flex-1 overflow-y-auto max-h-56 scrollbar-hidden">
            {singleLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin text-amber-400" /> Finding co-purchasers...
              </div>
            ) : !selectedProductId ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                Choose a product dropdown item to simulate basket cross-selling suggestions.
              </div>
            ) : singleProductRecs?.recommendations?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No co-purchase history exists in orders for this product.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-indigo-400 font-semibold mb-2 flex items-center gap-1.5">
                  Customers who bought "{singleProductRecs?.product_name}" also purchased:
                </div>
                {singleProductRecs?.recommendations?.map((rec: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                    <div>
                      <div className="font-bold text-slate-300">{rec.product_name}</div>
                      <div className="text-[10px] text-slate-500">{rec.category} · Price: ${rec.price}</div>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <span>Lift: {rec.lift}x</span>
                      <ArrowRight className="size-3 text-slate-600" />
                      <span>{Math.round(rec.confidence * 100)}% Match</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </motion.div>
  )
}
