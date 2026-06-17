import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { aiApi } from "@/lib/api"
import { priorityColor } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import type { Recommendation } from "@/types"
import {
  Brain, Sparkles, Loader2, Download, RefreshCw,
  TrendingDown, Lightbulb, FileText, Code2, Send,
  AlertCircle, CheckCircle2, ChevronRight, Target,
  BarChart2, Users, Zap,
} from "lucide-react"

// ── Data ──────────────────────────────────────────────────────────────────────
const INSIGHT_TYPES = [
  {
    key: "general",
    label: "Sales Overview",
    icon: BarChart2,
    desc: "Overall performance analysis",
    gradient: "from-indigo-500 to-violet-600",
    glow: "rgba(99,102,241,0.3)",
  },
  {
    key: "drop",
    label: "Revenue Drop",
    icon: TrendingDown,
    desc: "Root cause analysis for dips",
    gradient: "from-rose-500 to-red-600",
    glow: "rgba(239,68,68,0.3)",
  },
  {
    key: "improvement",
    label: "Improvements",
    icon: Lightbulb,
    desc: "Top growth strategies",
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.3)",
  },
  {
    key: "summary",
    label: "Executive Summary",
    icon: FileText,
    desc: "Full dashboard summary",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.3)",
  },
]

const NLP_EXAMPLES = [
  "Show me top 10 customers by revenue",
  "Monthly revenue trend for this year",
  "Which product category has the most sales?",
  "Compare revenue by city",
]

const PRIORITY_ICONS = {
  high: Zap,
  medium: Target,
  low: Lightbulb,
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
}

// ── Markdown prose styles ─────────────────────────────────────────────────────
const proseClass = "prose prose-sm dark:prose-invert max-w-none"

// ── Skeleton ──────────────────────────────────────────────────────────────────
function InsightSkeleton() {
  return (
    <div className="space-y-3 animate-pulse p-1">
      {[90, 75, 85, 60, 80, 50].map((w, i) => (
        <div key={i} className="h-3.5 bg-muted rounded-full" style={{ width: `${w}%` }} />
      ))}
      <div className="h-px bg-border my-4" />
      {[70, 55, 80].map((w, i) => (
        <div key={i} className="h-3.5 bg-muted rounded-full" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIInsightsPage() {
  const [activeType, setActiveType] = useState("general")
  const [insight, setInsight] = useState("")
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState("")

  // NLP → SQL state
  const [nlpQuestion, setNlpQuestion] = useState("")
  const [nlpResult, setNlpResult] = useState<{ sql: string; question: string } | null>(null)
  const [nlpLoading, setNlpLoading] = useState(false)
  const [nlpError, setNlpError] = useState("")
  const [sqlCopied, setSqlCopied] = useState(false)

  // Recommendations
  const { data: recsData, isLoading: recsLoading } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ["recommendations"],
    queryFn: () => aiApi.recommendations().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  })

  // Auto-generate "general" insight on mount
  useEffect(() => {
    generateInsight("general")
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const generateInsight = async (type: string) => {
    setActiveType(type)
    setInsightLoading(true)
    setInsightError("")
    setInsight("")
    try {
      const res = await aiApi.generateInsight(type)
      setInsight(res.data.insight || "No insight returned.")
    } catch {
      setInsightError("Failed to generate insight. Make sure the backend is running.")
    } finally {
      setInsightLoading(false)
    }
  }

  const handleNlpSubmit = async (question: string) => {
    if (!question.trim()) return
    setNlpQuestion(question)
    setNlpLoading(true)
    setNlpError("")
    setNlpResult(null)
    try {
      const res = await aiApi.nlpToSql(question)
      setNlpResult(res.data)
    } catch {
      setNlpError("Failed to convert query. Backend may be unavailable.")
    } finally {
      setNlpLoading(false)
    }
  }

  const handleCopySQL = () => {
    if (nlpResult?.sql) {
      navigator.clipboard.writeText(nlpResult.sql)
      setSqlCopied(true)
      setTimeout(() => setSqlCopied(false), 2000)
    }
  }

  const downloadInsight = () => {
    if (!insight) return
    const blob = new Blob([insight], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `insight-${activeType}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeConfig = INSIGHT_TYPES.find((t) => t.key === activeType)!

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      className="p-6 space-y-6 max-w-6xl"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="size-6 text-violet-400" /> AI Insights
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          GPT-powered business intelligence, trend detection, and strategic recommendations
        </p>
      </motion.div>

      {/* ── Insight type selector ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {INSIGHT_TYPES.map(({ key, label, icon: Icon, desc, gradient, glow }) => {
          const isActive = activeType === key
          return (
            <motion.button
              key={key}
              onClick={() => generateInsight(key)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={insightLoading}
              className={`relative text-left p-4 rounded-xl border transition-all duration-200 overflow-hidden disabled:cursor-not-allowed ${
                isActive
                  ? "border-indigo-500/40 bg-indigo-500/10"
                  : "glass-card hover:border-white/15"
              }`}
              style={isActive ? { boxShadow: `0 0 20px ${glow}` } : {}}
            >
              {isActive && (
                <motion.div
                  layoutId="insight-active-bg"
                  className="absolute inset-0 opacity-10"
                  style={{ background: `linear-gradient(135deg, ${glow}, transparent)` }}
                />
              )}
              <div className={`relative size-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}
                style={{ boxShadow: isActive ? `0 4px 16px ${glow}` : undefined }}>
                <Icon className="size-4 text-white" />
              </div>
              <div className={`relative font-semibold text-sm ${isActive ? "text-white" : ""}`}>{label}</div>
              <div className="relative text-xs text-muted-foreground mt-0.5">{desc}</div>
              {isActive && (
                <div className="absolute top-2.5 right-2.5">
                  <div className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
                </div>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* ── Insight output panel ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`size-8 rounded-lg bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center`}>
              <activeConfig.icon className="size-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">{activeConfig.label}</div>
              <div className="text-xs text-muted-foreground">{activeConfig.desc}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {insight && !insightLoading && (
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={downloadInsight}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <Download className="size-3.5" /> Download .md
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => generateInsight(activeType)}
              disabled={insightLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-medium hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {insightLoading
                ? <><Loader2 className="size-3.5 animate-spin" /> Generating...</>
                : <><RefreshCw className="size-3.5" /> Regenerate</>
              }
            </motion.button>
          </div>
        </div>

        {/* Panel body */}
        <div className="p-5 min-h-[280px]">
          <AnimatePresence mode="wait">
            {insightLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Sparkles className="size-3.5 text-violet-400 animate-pulse" />
                  AI is analyzing your data...
                </div>
                <InsightSkeleton />
              </motion.div>
            )}
            {insightError && !insightLoading && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm"
              >
                <AlertCircle className="size-5 shrink-0 text-rose-400" />
                <div>
                  <div className="font-medium">Generation failed</div>
                  <div className="text-xs text-rose-400/70 mt-0.5">{insightError}</div>
                </div>
              </motion.div>
            )}
            {insight && !insightLoading && !insightError && (
              <motion.div key="insight" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={proseClass}>
                  <ReactMarkdown>{insight}</ReactMarkdown>
                </div>
              </motion.div>
            )}
            {!insight && !insightLoading && !insightError && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Brain className="size-12 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">Select an insight type above to generate AI analysis</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── NLP → SQL ──────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
          <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center">
            <Code2 className="size-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Natural Language → SQL</div>
            <div className="text-xs text-muted-foreground">Ask a question in plain English, get a SQL query</div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleNlpSubmit(nlpQuestion) }} className="flex gap-2">
            <input
              value={nlpQuestion}
              onChange={(e) => setNlpQuestion(e.target.value)}
              placeholder="e.g. Show top 10 customers by total revenue"
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all"
            />
            <motion.button
              type="submit"
              disabled={nlpLoading || !nlpQuestion.trim()}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nlpLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </motion.button>
          </form>

          {/* Example pills */}
          <div className="flex flex-wrap gap-2">
            {NLP_EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => handleNlpSubmit(ex)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <ChevronRight className="size-3" /> {ex}
              </button>
            ))}
          </div>

          {/* Result */}
          <AnimatePresence>
            {nlpLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-muted-foreground py-2"
              >
                <Loader2 className="size-4 animate-spin text-cyan-400" /> Converting to SQL...
              </motion.div>
            )}
            {nlpError && !nlpLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs"
              >
                <AlertCircle className="size-4 shrink-0" /> {nlpError}
              </motion.div>
            )}
            {nlpResult && !nlpLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-xl border border-cyan-500/15 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-cyan-500/5 border-b border-cyan-500/10">
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                    <Code2 className="size-3.5" />
                    Generated SQL — "{nlpResult.question}"
                  </div>
                  <button onClick={handleCopySQL}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-all"
                  >
                    {sqlCopied ? <><CheckCircle2 className="size-3" /> Copied!</> : "Copy"}
                  </button>
                </div>
                <pre className="p-4 text-xs text-emerald-300 font-mono leading-relaxed overflow-x-auto bg-black/20 scrollbar-hidden whitespace-pre-wrap">
                  {nlpResult.sql}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Smart Recommendations ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-amber-400" />
          <h2 className="font-semibold">Smart Recommendations</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
            AI-generated
          </span>
        </div>

        {recsLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : recsData?.recommendations?.length ? (
          <div className="space-y-3">
            {recsData.recommendations.map((rec, i) => {
              const PIcon = PRIORITY_ICONS[rec.priority as keyof typeof PRIORITY_ICONS] ?? Lightbulb
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex gap-4 p-4 rounded-xl glass-card hover:border-white/[0.1] transition-all"
                >
                  <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${priorityColor(rec.priority as "high" | "medium" | "low")}`}>
                      <PIcon className="size-2.5" />
                      {rec.priority}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{rec.title}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Target className="size-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">{rec.estimated_impact}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl text-center">
            <Users className="size-10 text-slate-600 mb-3" />
            <p className="text-slate-500 text-sm">No recommendations available</p>
            <p className="text-xs text-slate-600 mt-1">Make sure the backend is running on port 8000</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
