import { useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, FileSpreadsheet, FileJson, FileText, CheckCircle2, AlertCircle,
  RefreshCw, Sparkles, Database, Download, X, ChevronDown, ChevronUp,
  TrendingUp, DollarSign, ShoppingCart, Users, BarChart2, AlertTriangle,
  ChevronRight, Eye, Wand2, Save, Shield, Zap, FileCode2,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { useUploadStore } from "@/store/uploadStore"
import type { DetectedColumn, SemanticField, ProcessedDataset } from "@/store/uploadStore"
import {
  parseFile, buildColumns, validateAndClean,
  buildAnalytics, computeQualityScore, generateAISummary,
} from "@/lib/dataEngine"

const CHART_COLORS = ["#818cf8","#a78bfa","#22d3ee","#34d399","#fbbf24","#f87171","#fb923c","#c084fc"]
const TOOLTIP_STYLE = { background:"#0d1117", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#e2e8f0", fontSize:11 }

const SEMANTIC_OPTIONS: { value: SemanticField; label: string }[] = [
  { value: "revenue",     label: "Revenue / Amount" },
  { value: "orders",      label: "Orders Count" },
  { value: "order_id",    label: "Order ID" },
  { value: "customers",   label: "Customers Count" },
  { value: "customer_id", label: "Customer ID" },
  { value: "date",        label: "Date / Time" },
  { value: "category",    label: "Category" },
  { value: "product",     label: "Product Name" },
  { value: "region",      label: "Region / City" },
  { value: "quantity",    label: "Quantity / Units" },
  { value: "price",       label: "Unit Price" },
  { value: "ignore",      label: "— Ignore this column —" },
]

const PIPELINE_STEPS = [
  { id: "parse",    label: "Parsing file",           icon: FileCode2   },
  { id: "detect",   label: "Detecting columns",       icon: Eye         },
  { id: "validate", label: "Validating data",         icon: Shield      },
  { id: "clean",    label: "Cleaning & normalising",  icon: Wand2       },
  { id: "analyse",  label: "Building analytics",      icon: BarChart2   },
  { id: "save",     label: "Saving to store",         icon: Save        },
]

type Stage = "idle" | "loaded" | "mapping" | "processing" | "done"

const fmtCurrency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

const typeBadge = (type: DetectedColumn["type"]) => {
  const map = {
    numeric: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    date:    "bg-cyan-500/20   text-cyan-300   border-cyan-500/30",
    text:    "bg-violet-500/20 text-violet-300 border-violet-500/30",
    unknown: "bg-slate-500/20  text-slate-400  border-slate-500/30",
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${map[type]}`}>
      {type}
    </span>
  )
}

const severityStyles = {
  error:   "border-rose-500/30   bg-rose-500/8   text-rose-300",
  warning: "border-amber-500/30  bg-amber-500/8  text-amber-300",
  info:    "border-indigo-500/30 bg-indigo-500/8 text-indigo-300",
}
const severityIcons = {
  error:   <AlertCircle  className="size-3.5 text-rose-400  shrink-0" />,
  warning: <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />,
  info:    <Zap          className="size-3.5 text-indigo-400 shrink-0" />,
}

export default function DataIntelligencePage() {
  const setDataset = useUploadStore(s => s.setDataset)
  const savedDataset = useUploadStore(s => s.dataset)

  const [stage, setStage] = useState<Stage>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<DetectedColumn[]>([])
  const [dataset, setLocalDataset] = useState<ProcessedDataset | null>(null)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [showProcessing, setShowProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (f: File) => {
    setFile(f); setError(null); setLocalDataset(null)
    setStage("loaded")
    try {
      const rows = await parseFile(f) as Record<string, unknown>[]
      const cols = buildColumns(rows as Record<string, string>[])
      setRawRows(rows)
      setColumns(cols)
      setStage("mapping")
    } catch (e) {
      setError(`Failed to parse file: ${e instanceof Error ? e.message : "Unknown error"}`)
      setStage("idle")
    }
  }, [])

  const handleProcess = useCallback(async () => {
    if (!file || !rawRows.length) return
    setShowProcessing(true)
    setPipelineStep(0)
    setError(null)

    try {
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

      await delay(400); setPipelineStep(1)
      await delay(500); setPipelineStep(2)

      const { rows: cleanedRows, issues, duplicatesRemoved, nullsFilled } =
        validateAndClean(rawRows as Record<string, string>[], columns)
      await delay(600); setPipelineStep(3)
      await delay(400); setPipelineStep(4)

      const analytics = buildAnalytics(cleanedRows, columns)
      await delay(600); setPipelineStep(5)

      const totalRows = rawRows.length
      const cleanRows = cleanedRows.length
      const qualityScore = computeQualityScore(issues, totalRows, duplicatesRemoved, nullsFilled)
      const aiSummary = generateAISummary(
        file.name, totalRows, cleanRows, qualityScore, {
          total_revenue: analytics.total_revenue,
          total_orders: analytics.total_orders,
          total_customers: analytics.total_customers,
          avg_order_value: analytics.avg_order_value,
          revenue_growth: analytics.revenue_growth,
          orders_growth: analytics.orders_growth,
        }, columns
      )

      const processed: ProcessedDataset = {
        id: `ds_${Date.now()}`,
        filename: file.name,
        format: file.name.split(".").pop()?.toLowerCase() as ProcessedDataset["format"] ?? "csv",
        uploadedAt: new Date().toISOString(),
        totalRows,
        cleanRows,
        totalCols: columns.length,
        fileSizeKb: Math.round(file.size / 1024),
        columns,
        issues,
        duplicatesRemoved,
        nullsFilled,
        qualityScore,
        aiSummary,
        preview: cleanedRows.slice(0, 20),
        kpis: {
          total_revenue: analytics.total_revenue,
          total_orders: analytics.total_orders,
          total_customers: analytics.total_customers,
          avg_order_value: analytics.avg_order_value,
          revenue_growth: analytics.revenue_growth,
          orders_growth: analytics.orders_growth,
        },
        monthly_trend: analytics.monthly_trend,
        category_revenue: analytics.category_revenue,
        top_products: analytics.top_products,
      }

      await delay(300)
      setDataset(processed)
      setLocalDataset(processed)
      setPipelineStep(PIPELINE_STEPS.length)
      await delay(500)

      setShowProcessing(false)
      setStage("done")
    } catch (e) {
      setShowProcessing(false)
      setError(`Processing failed: ${e instanceof Error ? e.message : "Unknown error"}`)
      setStage("mapping")
    }
  }, [file, rawRows, columns, setDataset])

  const handleExportCSV = useCallback(() => {
    if (!dataset?.preview.length) return
    const headers = Object.keys(dataset.preview[0])
    const rows = dataset.preview.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `${dataset.filename.replace(/\.[^.]+$/, "")}_cleaned.csv`
    a.click(); URL.revokeObjectURL(url)
  }, [dataset])

  const reset = useCallback(() => {
    setFile(null); setRawRows([]); setColumns([])
    setLocalDataset(null); setStage("idle"); setError(null)
  }, [])

  return (
    <div className="min-h-full bg-[#070b14]/10 text-slate-100 p-6 space-y-6 max-w-6xl mx-auto">
      <AnimatePresence>
        {showProcessing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-2xl p-8 max-w-sm w-full text-center"
              style={{ boxShadow: "0 0 80px rgba(99,102,241,0.2)" }}
            >
              <div className="size-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5"
                style={{ boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>
                <RefreshCw className="size-7 text-white animate-spin" />
              </div>
              <h3 className="text-lg font-bold mb-1">AI Cleaning & Structuring</h3>
              <p className="text-slate-400 text-sm mb-6">Running pipeline steps…</p>

              <div className="space-y-2.5">
                {PIPELINE_STEPS.map((s, i) => {
                  const done    = i < pipelineStep
                  const active  = i === pipelineStep
                  const pending = i > pipelineStep
                  const Icon = s.icon
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: pending ? 0.35 : 1, x: 0 }}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 transition-all
                        ${done   ? "bg-emerald-500/20 border border-emerald-500/30" :
                          active ? "bg-indigo-500/20  border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.35)]" :
                                   "bg-white/[0.03]   border border-white/[0.06]"}`}
                      >
                        {done
                          ? <CheckCircle2 className="size-3.5 text-emerald-400" />
                          : <Icon className={`size-3.5 ${active ? "text-indigo-400 animate-pulse" : "text-slate-600"}`} />
                        }
                      </div>
                      <span className={`text-xs font-medium
                        ${done ? "text-emerald-400" : active ? "text-slate-200" : "text-slate-600"}`}>
                        {s.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa, #22d3ee)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((pipelineStep + 1) / PIPELINE_STEPS.length) * 100}%` }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="size-8 rounded-xl gradient-primary flex items-center justify-center shrink-0"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
              <Database className="size-4 text-white" />
            </div>
            Data Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Auto detect columns, resolve null/missing values, and preview structured analytics before loading
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dataset && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
            >
              <Download className="size-4" /> Export CSV
            </motion.button>
          )}
          {stage !== "idle" && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={reset}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] text-sm text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="size-4" /> New Upload
            </motion.button>
          )}
        </div>
      </div>

      {/* Flow views */}
      {stage === "idle" && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
            onClick={() => {
              const el = document.createElement("input")
              el.type = "file"
              el.accept = ".csv,.xlsx,.xls,.json"
              el.onchange = ev => {
                const f = (ev.target as HTMLInputElement).files?.[0]
                if (f) handleFile(f)
              }
              el.click()
            }}
            className="border-2 border-dashed border-white/[0.08] hover:border-indigo-500/50 hover:bg-white/[0.02] transition-all rounded-2xl p-16 text-center cursor-pointer space-y-4"
          >
            <div className="size-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto text-slate-400">
              <Upload className="size-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-200">Drag your dataset file here</p>
              <p className="text-sm text-slate-500">Supports CSV, Excel (XLSX/XLS), and JSON format files</p>
            </div>
          </div>
        </motion.div>
      )}

      {stage === "mapping" && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-6">
          {/* Column selector */}
          <div className="glass-card rounded-xl overflow-hidden border border-white/5">
            <div className="px-4 py-3 bg-muted/40 border-b border-white/5 flex items-center gap-2">
              <Eye className="size-4.5 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">Semantic Column Mapper</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {columns.map((col, i) => (
                <div key={col.raw} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.01]">
                  <span className="text-slate-600 text-xs w-6 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-300 font-bold">{col.raw}</span>
                      {typeBadge(col.type)}
                      {col.nullPct > 0 && <span className="text-[10px] text-rose-400">{col.nullPct}% empty</span>}
                    </div>
                  </div>
                  <ChevronRight className="size-3 text-slate-700 shrink-0" />
                  <select
                    value={col.mapped}
                    onChange={e => {
                      const next = [...columns]
                      next[i] = { ...next[i], mapped: e.target.value as SemanticField }
                      setColumns(next)
                    }}
                    className="text-xs bg-[#0d1424] border border-white/[0.08] rounded-lg px-2 py-1.5 text-slate-300 min-w-[160px]"
                  >
                    {SEMANTIC_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleProcess}
            className="px-5 py-3 rounded-xl gradient-primary text-white text-xs font-bold w-full cursor-pointer hover:opacity-90 shadow-lg shadow-indigo-500/15"
          >
            Clean & Process Dataset
          </button>
        </motion.div>
      )}

      {stage === "done" && dataset && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-6">
          {/* Quality summary block */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 bg-emerald-500/5 relative overflow-hidden flex items-center gap-5">
            <div className="size-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h3 className="text-md font-bold text-emerald-300">Cleaned dataset loaded successfully</h3>
              <p className="text-xs text-slate-400 mt-1">Processed {dataset.cleanRows} rows. Duplicates removed: {dataset.duplicatesRemoved}. Missing entries filled: {dataset.nullsFilled}.</p>
            </div>
          </div>

          {/* Previews grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
              <div className="text-xs text-slate-500 font-semibold mb-3 uppercase">Quality Index Score</div>
              <div className="text-2xl font-black text-indigo-300">{dataset.qualityScore}%</div>
              <div className="w-full bg-white/[0.04] h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${dataset.qualityScore}%` }} />
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-900/40">
              <div className="text-xs text-slate-500 font-semibold mb-1 uppercase">AI Insights Report Overview</div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{dataset.aiSummary}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
