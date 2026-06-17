import { useMemo, useState, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  Zap, Target, X, BarChart2, ChevronRight,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { fadeUp } from "@/lib/animations"
import type { DashboardData } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Insight {
  id: string
  type: "positive" | "warning" | "action" | "info"
  icon: React.ElementType
  title: string
  description: string
  action: string
  metric?: string
  detail: string   // shown in drill-down modal
  gradient: string
  border: string
}

// ── Insight generator ─────────────────────────────────────────────────────────
function generateInsights(data: DashboardData): Insight[] {
  const { kpis, category_revenue, top_products, monthly_trend } = data

  const insights: Insight[] = []

  // 1. Revenue growth
  if (kpis.revenue_growth >= 10) {
    insights.push({
      id: "rev-growth",
      type: "positive",
      icon: TrendingUp,
      title: "Strong Revenue Growth",
      description: `Revenue is up ${kpis.revenue_growth}% vs last month — outpacing the 8% industry average.`,
      action: "Double down on top-performing categories with targeted ads.",
      metric: `+${kpis.revenue_growth}%`,
      detail: `Total revenue reached ${formatCurrency(kpis.total_revenue)} this period. Growth is driven primarily by ${category_revenue[0]?.category ?? "Electronics"}. Sustaining this momentum requires maintaining stock levels and running retention campaigns for high-LTV customers.`,
      gradient: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/25",
    })
  } else if (kpis.revenue_growth < 0) {
    insights.push({
      id: "rev-drop",
      type: "warning",
      icon: TrendingDown,
      title: "Revenue Decline Detected",
      description: `Revenue dropped ${Math.abs(kpis.revenue_growth)}% — investigate category and region performance.`,
      action: "Run flash promotions and re-engage churned customers via email.",
      metric: `${kpis.revenue_growth}%`,
      detail: `A ${Math.abs(kpis.revenue_growth)}% drop signals demand softness or a seasonality effect. Check if order volume fell proportionally — a drop in both revenue and orders suggests demand issues rather than pricing.`,
      gradient: "from-rose-500/20 to-red-500/10",
      border: "border-rose-500/25",
    })
  }

  // 2. Top category
  if (category_revenue.length > 0) {
    const top = category_revenue.reduce((a, b) => a.revenue > b.revenue ? a : b)
    const share = Math.round((top.revenue / category_revenue.reduce((s, c) => s + c.revenue, 0)) * 100)
    insights.push({
      id: "top-cat",
      type: "info",
      icon: BarChart2,
      title: `${top.category} Leads Revenue`,
      description: `${top.category} accounts for ${share}% of total revenue — your strongest category.`,
      action: `Expand ${top.category} SKUs and create bundles to increase basket size.`,
      metric: `${share}%`,
      detail: `${top.category} generated ${formatCurrency(top.revenue)} — ${share}% of the portfolio mix. Consider launching a premium tier within this category and investing in inventory buffer to avoid stock-outs during peak demand.`,
      gradient: "from-indigo-500/20 to-violet-500/10",
      border: "border-indigo-500/25",
    })
  }

  // 3. Low performer alert
  if (category_revenue.length > 1) {
    const low = category_revenue.reduce((a, b) => a.revenue < b.revenue ? a : b)
    const total = category_revenue.reduce((s, c) => s + c.revenue, 0)
    const share = Math.round((low.revenue / total) * 100)
    insights.push({
      id: "low-cat",
      type: "warning",
      icon: AlertTriangle,
      title: `${low.category} Underperforming`,
      description: `${low.category} contributes only ${share}% of revenue. Optimise or deprioritise.`,
      action: "Consider clearance promotions or bundling with high-demand products.",
      metric: `${share}%`,
      detail: `${low.category} revenue of ${formatCurrency(low.revenue)} may not cover operational costs. Evaluate supplier contracts, marketing spend, and compare against seasonal trends before making inventory decisions.`,
      gradient: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/25",
    })
  }

  // 4. Avg order value tip
  if (kpis.avg_order_value < 200) {
    insights.push({
      id: "aov-low",
      type: "action",
      icon: Zap,
      title: "Boost Average Order Value",
      description: `AOV of ${formatCurrency(kpis.avg_order_value)} is below the $200 benchmark for e-commerce.`,
      action: "Add upsell prompts, free-shipping thresholds, and product bundles at checkout.",
      metric: formatCurrency(kpis.avg_order_value),
      detail: `Raising AOV by just 10% would add ~${formatCurrency(kpis.total_revenue * 0.1)} in revenue without acquiring a single new customer. Focus on post-add-to-cart recommendations and tiered loyalty rewards.`,
      gradient: "from-cyan-500/20 to-blue-500/10",
      border: "border-cyan-500/25",
    })
  }

  // 5. Best product opportunity
  if (top_products.length > 0) {
    const best = top_products[0]
    insights.push({
      id: "best-prod",
      type: "positive",
      icon: Target,
      title: `"${best.name}" Is Your Star Product`,
      description: `${best.name} sold ${best.units} units — far ahead of other products. Scale it.`,
      action: "Feature it prominently in ads, email campaigns, and homepage banners.",
      metric: `${best.units} units`,
      detail: `Star products like ${best.name} anchor customer trust. Consider creating a product family around it (accessories, variants, bundles) to increase attach rate and protect against competitive alternatives.`,
      gradient: "from-violet-500/20 to-purple-500/10",
      border: "border-violet-500/25",
    })
  }

  // 6. MoM trend check
  if (monthly_trend.length >= 2) {
    const last = monthly_trend[monthly_trend.length - 1]
    const prev = monthly_trend[monthly_trend.length - 2]
    const mom = Math.round(((last.revenue - prev.revenue) / prev.revenue) * 100)
    if (mom < -5) {
      insights.push({
        id: "mom-drop",
        type: "warning",
        icon: Lightbulb,
        title: "Month-on-Month Dip",
        description: `${last.month} revenue fell ${Math.abs(mom)}% vs ${prev.month}. Review campaign performance.`,
        action: "Activate retargeting ads and send win-back emails to lapsed buyers.",
        metric: `${mom}%`,
        detail: `A MoM dip of ${Math.abs(mom)}% in ${last.month} suggests a campaign gap or seasonality. Cross-reference against marketing spend — a drop in spend typically precedes a revenue dip with a 2–4 week lag.`,
        gradient: "from-rose-500/15 to-amber-500/10",
        border: "border-rose-500/20",
      })
    }
  }

  return insights.slice(0, 5) // max 5 cards
}

// ── Drill-down modal ──────────────────────────────────────────────────────────
function DrillDownModal({ insight, onClose }: { insight: Insight; onClose: () => void }) {
  const Icon = insight.icon
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        className={`glass-card rounded-2xl p-7 max-w-lg w-full border ${insight.border} relative`}
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <X className="size-4" />
        </button>

        {/* Icon */}
        <div className={`size-12 rounded-2xl bg-gradient-to-br ${insight.gradient} border ${insight.border} flex items-center justify-center mb-5`}>
          <Icon className="size-6 text-foreground" />
        </div>

        {insight.metric && (
          <div className="text-3xl font-black mb-1 gradient-text-static">{insight.metric}</div>
        )}
        <h3 className="text-lg font-bold mb-2">{insight.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">{insight.detail}</p>

        {/* Action */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <Zap className="size-4 text-primary mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Recommended Action</div>
            <p className="text-sm text-foreground">{insight.action}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Insight card ──────────────────────────────────────────────────────────────
const TYPE_ICON_COLOR = {
  positive: "text-emerald-400",
  warning:  "text-amber-400",
  action:   "text-cyan-400",
  info:     "text-indigo-400",
}

function InsightCard({ insight, index, onClick }: { insight: Insight; index: number; onClick: () => void }) {
  const Icon = insight.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className={`glass-card rounded-xl p-5 border ${insight.border} cursor-pointer group relative overflow-hidden`}
    >
      {/* Gradient wash */}
      <div className={`absolute inset-0 bg-gradient-to-br ${insight.gradient} opacity-60 pointer-events-none`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`size-9 rounded-xl bg-gradient-to-br ${insight.gradient} border ${insight.border} flex items-center justify-center shrink-0`}>
            <Icon className={`size-4 ${TYPE_ICON_COLOR[insight.type]}`} />
          </div>
          {insight.metric && (
            <span className="text-lg font-black gradient-text-static">{insight.metric}</span>
          )}
        </div>

        <h3 className="font-semibold text-sm mb-1.5">{insight.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{insight.description}</p>

        {/* Action */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
          <Lightbulb className="size-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.action}</p>
        </div>

        {/* Drill-down cue */}
        <div className="flex items-center gap-1 mt-3 text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View details</span>
          <ChevronRight className="size-3" />
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface AIInsightsPanelProps {
  data: DashboardData
}

export const AIInsightsPanel = memo(function AIInsightsPanel({ data }: AIInsightsPanelProps) {
  const insights = useMemo(() => generateInsights(data), [data])
  const [active, setActive] = useState<Insight | null>(null)

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="size-6 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="size-3.5 text-white" />
          </div>
          <h2 className="font-semibold">AI Insights</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border ml-1">
            {insights.length} signals
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">Click a card for details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {insights.map((ins, i) => (
            <InsightCard key={ins.id} insight={ins} index={i} onClick={() => setActive(ins)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && <DrillDownModal insight={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </>
  )
})
