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

// ── Constants ─────────────────────────────────────────────────────────────────
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

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

const fileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "json")               return <FileJson  className="size-5 text-amber-400"  />
  if (ext === "xlsx" || ext==="xls")return <FileSpreadsheet className="size-5 text-emerald-400" />
  return                                   <FileText  className="size-5 text-indigo-400" />
}

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

// ── Quality ring ──────────────────────────────────────────────────────────────
function QualityRing({ score }: { score: number }) {
  const r = 28, circ = 2 * Math.PI * r
  const color = score >= 85 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171"
  return (
    <div className="relative size-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-xl font-black" style={{ color }}>{score}%</span>
        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wide">Quality</span>
      </div>
    </div>
  )
}

// ── Drop zone ─────────────────────────────────────────────────────────────────
function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase()
    if (!["csv","xlsx","xls","json"].includes(ext ?? "")) return
    onFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) accept(f)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden
        ${dragging
          ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
          : "border-white/[0.08] hover:border-indigo-500/50 hover:bg-white/[0.02]"
        }`}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) accept(f) }} />

      {/* Animated grid bg */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

      <div className="relative z-10 flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
        <motion.div
          animate={{ y: dragging ? -6 : [0, -4, 0] }}
          transition={dragging ? { duration: 0.2 } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className={`size-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${dragging ? "bg-indigo-500/25 shadow-[0_0_30px_rgba(99,102,241,0.4)]" : "bg-white/[0.04] border border-white/[0.07]"}`}
        >
          <Upload className={`size-7 transition-colors ${dragging ? "text-indigo-400" : "text-slate-500"}`} />
        </motion.div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-200">
            {dragging ? "Release to upload" : "Drop your dataset here"}
          </p>
          <p className="text-sm text-slate-500">or click to browse files</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {["CSV", "XLSX", "JSON"].map(fmt => (
            <span key={fmt}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-400 tracking-wide">
              .{fmt.toLowerCase()}
            </span>
          ))}
          <span className="text-[11px] text-slate-600">· max 50 MB</span>
        </div>
      </div>
    </div>
  )
}

// ── Processing overlay ────────────────────────────────────────────────────────
function ProcessingOverlay({ step }: { step: number }) {
  return (
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
        <h3 className="text-lg font-bold mb-1">Processing Dataset</h3>
        <p className="text-slate-400 text-sm mb-6">Running {PIPELINE_STEPS.length}-step pipeline…</p>

        <div className="space-y-2.5">
          {PIPELINE_STEPS.map((s, i) => {
            const done    = i < step
            const active  = i === step
            const pending = i > step
            const Icon = s.icon
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: pending ? 0.35 : 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
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
                  {active && <span className="ml-1 text-indigo-400 animate-pulse">…</span>}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa, #22d3ee)" }}
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / PIPELINE_STEPS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[11px] text-slate-600 mt-2">
          Step {Math.min(step + 1, PIPELINE_STEPS.length)} / {PIPELINE_STEPS.length}
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Column mapper ─────────────────────────────────────────────────────────────
function ColumnMapper({
  columns, onChange,
}: { columns: DetectedColumn[]; onChange: (cols: DetectedColumn[]) => void }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? columns : columns.slice(0, 6)

  const update = (idx: number, mapped: SemanticField) => {
    const next = [...columns]
    next[idx] = { ...next[idx], mapped }
    onChange(next)
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Auto Column Detection</span>
          <span className="text-xs text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
            {columns.length} columns
          </span>
        </div>
        <span className="text-[11px] text-slate-500">Correct mappings if needed</span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {visible.map((col, i) => (
          <div key={col.raw} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
            {/* Index */}
            <span className="text-[10px] text-slate-600 w-5 shrink-0">{i + 1}</span>

            {/* Column name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono font-medium text-slate-300 truncate">{col.raw}</span>
                {typeBadge(col.type)}
                {col.nullPct > 0 && (
                  <span className="text-[10px] text-rose-400 font-medium">{col.nullPct}% null</span>
                )}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                Sample: {col.sample.slice(0, 3).join(" · ") || "—"}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="size-3.5 text-slate-700 shrink-0" />

            {/* Mapping dropdown */}
            <select
              value={col.mapped}
              onChange={e => update(i, e.target.value as SemanticField)}
              className="text-xs bg-[#0d1424] border border-white/[0.08] rounded-lg px-2 py-1.5 text-slate-300
                hover:border-indigo-500/40 focus:outline-none focus:border-indigo-500/60 transition-colors cursor-pointer
                appearance-none min-w-[160px]"
            >
              {SEMANTIC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {columns.length > 6 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full py-2.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1 border-t border-white/[0.04]"
        >
          {expanded
            ? <><ChevronUp   className="size-3" /> Show less</>
            : <><ChevronDown className="size-3" /> Show {columns.length - 6} more columns</>}
        </button>
      )}
    </div>
  )
}

// ── Preview table ─────────────────────────────────────────────────────────────
function PreviewTable({
  rows, columns,
}: { rows: Record<string, unknown>[]; columns: DetectedColumn[] }) {
  const [expanded, setExpanded] = useState(false)
  const visibleRows = expanded ? rows : rows.slice(0, 12)
  const visibleCols = columns.slice(0, 8)

  const isNull = (v: unknown) => v === null || v === undefined || v === "" || v === 0

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-violet-400" />
          <span className="text-sm font-semibold text-slate-200">Data Preview</span>
          <span className="text-xs text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
            {rows.length} rows
          </span>
        </div>
        {columns.length > 8 && (
          <span className="text-[11px] text-slate-600">Showing 8 of {columns.length} columns</span>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="px-3 py-2 text-left text-slate-600 font-medium w-8">#</th>
              {visibleCols.map(col => (
                <th key={col.raw} className="px-3 py-2 text-left whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-300 font-medium">{col.raw}</span>
                    <div className="flex items-center gap-1">
                      {typeBadge(col.type)}
                      {col.nullPct > 0 && (
                        <span className="text-[9px] text-rose-400">{col.nullPct}%↑</span>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, ri) => (
              <tr key={ri} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors group">
                <td className="px-3 py-2 text-slate-700">{ri + 1}</td>
                {visibleCols.map(col => {
                  const v = row[col.raw]
                  const empty = isNull(v)
                  return (
                    <td key={col.raw} className={`px-3 py-2 whitespace-nowrap max-w-[150px] truncate transition-colors
                      ${empty ? "bg-rose-500/10 text-rose-400/70 italic" : "text-slate-300"}`}>
                      {empty ? "null" : String(v)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 12 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full py-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1 border-t border-white/[0.04]"
        >
          {expanded
            ? <><ChevronUp   className="size-3" /> Show less</>
            : <><ChevronDown className="size-3" /> Show {rows.length - 12} more rows</>}
        </button>
      )}
    </div>
  )
}

// ── Chart previews ────────────────────────────────────────────────────────────
function ChartPreviews({ dataset }: { dataset: ProcessedDataset }) {
  const { monthly_trend, category_revenue } = dataset
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Revenue Trend Preview</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthly_trend}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 10, fill: "#475569" }}
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={v => [fmtCurrency(Number(v)), "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2}
              fill="url(#revGrad)" dot={false} activeDot={{ r: 3, fill: "#818cf8" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="size-4 text-violet-400" />
          <span className="text-sm font-semibold text-slate-200">Category Revenue Preview</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={category_revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="category" tick={{ fontSize: 9, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 10, fill: "#475569" }}
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={v => [fmtCurrency(Number(v)), "Revenue"]} />
            <Bar dataKey="revenue" radius={[4,4,0,0]}>
              {category_revenue.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Validation panel ──────────────────────────────────────────────────────────
function ValidationPanel({ issues }: { issues: ProcessedDataset["issues"] }) {
  if (!issues.length) {
    return (
      <div className="glass-card rounded-xl p-4 flex items-center gap-3 border border-emerald-500/20">
        <div className="size-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="size-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-300">No validation issues found</p>
          <p className="text-xs text-slate-500">Dataset looks clean and well-structured</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
        <Shield className="size-4 text-amber-400" />
        <span className="text-sm font-semibold text-slate-200">Validation Results</span>
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 ml-auto">
          {issues.length} issue{issues.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {issues.map((issue, i) => (
          <div key={i}
            className={`flex items-start gap-3 px-4 py-3 border-l-2 ${
              issue.severity === "error" ? "border-l-rose-500" :
              issue.severity === "warning" ? "border-l-amber-500" : "border-l-indigo-500"
            }`}>
            <div className={`mt-0.5 size-6 rounded flex items-center justify-center shrink-0 ${severityStyles[issue.severity]}`}>
              {severityIcons[issue.severity]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-300">{issue.message}</p>
              <p className="text-[11px] text-slate-600 mt-0.5 capitalize">
                {issue.kind.replace("_", " ")}
                {issue.col !== "*" && ` · column: "${issue.col}"`}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${severityStyles[issue.severity]}`}>
              {issue.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Success banner ────────────────────────────────────────────────────────────
function SuccessBanner({ dataset }: { dataset: ProcessedDataset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl p-6 border border-emerald-500/25"
      style={{
        background: "linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.04) 100%)",
        boxShadow: "0 0 60px rgba(52,211,153,0.08)",
      }}
    >
      {/* Glow blob */}
      <div className="absolute top-0 right-0 size-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0"
          style={{ boxShadow: "0 0 24px rgba(52,211,153,0.25)" }}>
          <CheckCircle2 className="size-7 text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-emerald-300 mb-1">✅ Data Ready for Analysis</h3>
          <p className="text-slate-400 text-sm">
            <strong className="text-slate-200">{dataset.cleanRows.toLocaleString()} records</strong> processed
            from <strong className="text-slate-200">{dataset.filename}</strong>.
            {dataset.duplicatesRemoved > 0 && (
              <> <span className="text-amber-400">{dataset.duplicatesRemoved} duplicates</span> removed.</>
            )}
            {dataset.nullsFilled > 0 && (
              <> <span className="text-indigo-400">{dataset.nullsFilled} nulls</span> filled.</>
            )}
          </p>
        </div>

        {/* KPI strip */}
        <div className="flex items-center gap-4 shrink-0 flex-wrap">
          {[
            { icon: DollarSign, val: fmtCurrency(dataset.kpis.total_revenue),   label: "Revenue", color: "text-indigo-400" },
            { icon: ShoppingCart, val: dataset.kpis.total_orders.toLocaleString(), label: "Orders",  color: "text-violet-400" },
            { icon: Users, val: dataset.kpis.total_customers.toLocaleString(),  label: "Customers",color: "text-cyan-400" },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <Icon className={`size-4 ${color}`} />
              <span className="text-sm font-bold text-slate-200">{val}</span>
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function DataUploadPage() {
  const setDataset = useUploadStore(s => s.setDataset)
  const savedDataset = useUploadStore(s => s.dataset)

  // Pipeline state
  const [stage, setStage] = useState<Stage>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<DetectedColumn[]>([])
  const [dataset, setLocalDataset] = useState<ProcessedDataset | null>(null)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [showProcessing, setShowProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Step 1: File selected → parse & detect ──────────────────────────────
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

  // ── Step 2: Process & Save ──────────────────────────────────────────────
  const handleProcess = useCallback(async () => {
    if (!file || !rawRows.length) return
    setShowProcessing(true)
    setPipelineStep(0)
    setError(null)

    try {
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

      // Step 0: parse (already done — show for UX)
      await delay(500); setPipelineStep(1)

      // Step 1: detect
      await delay(600); setPipelineStep(2)

      // Step 2: validate + clean
      const { rows: cleanedRows, issues, duplicatesRemoved, nullsFilled } =
        validateAndClean(rawRows as Record<string, string>[], columns)
      await delay(700); setPipelineStep(3)

      // Step 3: clean + normalise
      await delay(500); setPipelineStep(4)

      // Step 4: analytics
      const analytics = buildAnalytics(cleanedRows, columns)
      await delay(700); setPipelineStep(5)

      // Step 5: quality + summary
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

      await delay(400)

      // Save to global store
      setDataset(processed)
      setLocalDataset(processed)
      setPipelineStep(PIPELINE_STEPS.length)
      await delay(600)

      setShowProcessing(false)
      setStage("done")
    } catch (e) {
      setShowProcessing(false)
      setError(`Processing failed: ${e instanceof Error ? e.message : "Unknown error"}`)
      setStage("mapping")
    }
  }, [file, rawRows, columns, setDataset])

  // ── Export cleaned CSV ──────────────────────────────────────────────────
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

  // KPI cards for results
  const kpiCards = useMemo(() => dataset ? [
    { icon: DollarSign,   label: "Total Revenue",    val: fmtCurrency(dataset.kpis.total_revenue),                color: "bg-indigo-500",  glow: "rgba(99,102,241,0.3)"  },
    { icon: ShoppingCart, label: "Total Orders",     val: dataset.kpis.total_orders.toLocaleString(),            color: "bg-violet-500",  glow: "rgba(139,92,246,0.3)"  },
    { icon: Users,        label: "Customers",        val: dataset.kpis.total_customers.toLocaleString(),         color: "bg-cyan-500",    glow: "rgba(6,182,212,0.3)"   },
    { icon: TrendingUp,   label: "Avg Order Value",  val: fmtCurrency(dataset.kpis.avg_order_value),             color: "bg-emerald-500", glow: "rgba(52,211,153,0.3)"  },
  ] : [], [dataset])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#070b14] text-slate-100">
      <AnimatePresence>
        {showProcessing && <ProcessingOverlay step={pipelineStep} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5">
              <div className="size-8 rounded-xl gradient-primary flex items-center justify-center shrink-0"
                style={{ boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
                <Database className="size-4 text-white" />
              </div>
              Data Upload & Processing
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Upload CSV, Excel, or JSON → validate → clean → feed analytics
            </p>
          </div>

          <div className="flex items-center gap-2">
            {savedDataset && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="size-3.5" />
                Dataset active
              </div>
            )}
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
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] text-sm text-slate-400 hover:text-slate-200 transition-all"
              >
                <X className="size-4" /> New Upload
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── Pipeline progress strip ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hidden">
            {[
              { label: "Upload",   done: stage !== "idle"     },
              { label: "Parse",    done: stage === "mapping" || stage === "processing" || stage === "done" },
              { label: "Map",      done: stage === "processing" || stage === "done" },
              { label: "Process",  done: stage === "done"      },
              { label: "Analyse",  done: stage === "done"      },
              { label: "Ready",    done: stage === "done"      },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-1 shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${s.done ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25" : "text-slate-600 border border-white/[0.04]"}`}>
                  {s.done && <CheckCircle2 className="size-3" />}
                  {s.label}
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight className={`size-3.5 shrink-0 ${s.done ? "text-indigo-500" : "text-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Drop zone (idle / loaded) ────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {stage === "idle" && (
            <motion.div key="dropzone" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <DropZone onFile={handleFile} />

              {/* Format cards */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { fmt: "CSV",  desc: "Comma-separated values",  color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/20", icon: <FileText  className="size-5 text-indigo-400"  /> },
                  { fmt: "XLSX", desc: "Excel spreadsheet",       color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20", icon: <FileSpreadsheet className="size-5 text-emerald-400" /> },
                  { fmt: "JSON", desc: "JSON array of objects",   color: "from-amber-500/20 to-amber-600/10",   border: "border-amber-500/20",   icon: <FileJson  className="size-5 text-amber-400"  /> },
                ].map(f => (
                  <div key={f.fmt}
                    className={`glass-card rounded-xl p-4 border ${f.border} bg-gradient-to-br ${f.color} flex items-center gap-3`}>
                    <div className="shrink-0">{f.icon}</div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">.{f.fmt.toLowerCase()}</div>
                      <div className="text-[11px] text-slate-500">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Previous dataset hint */}
              {savedDataset && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 glass-card rounded-xl p-4 flex items-center gap-4 border border-indigo-500/15"
                >
                  <div className="size-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <Database className="size-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-300 truncate">
                      Last dataset: <span className="text-indigo-300">{savedDataset.filename}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {savedDataset.cleanRows.toLocaleString()} rows · quality {savedDataset.qualityScore}% ·{" "}
                      {new Date(savedDataset.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                    Active
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Mapping + validation stage ─────────────────────────────────── */}
          {(stage === "mapping" || stage === "done") && (
            <motion.key key="mapping"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* File info bar */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border border-white/[0.06] mb-4"
                >
                  <div className="shrink-0">{fileIcon(file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB ·{" "}
                      {rawRows.length.toLocaleString()} rows ·{" "}
                      {columns.length} columns
                    </p>
                  </div>
                  {stage !== "done" && (
                    <button onClick={reset}
                      className="text-slate-600 hover:text-slate-300 transition-colors p-1">
                      <X className="size-4" />
                    </button>
                  )}
                </motion.div>
              )}

              {/* Column mapper */}
              {columns.length > 0 && stage === "mapping" && (
                <div className="mb-4">
                  <ColumnMapper columns={columns} onChange={setColumns} />
                </div>
              )}

              {/* Validation issues */}
              {columns.length > 0 && stage === "mapping" && (() => {
                const { issues, duplicatesRemoved, nullsFilled } =
                  validateAndClean(rawRows as Record<string, string>[], columns)
                return (
                  <div className="mb-4 space-y-4">
                    <ValidationPanel issues={issues} />

                    {/* Quality score preview */}
                    <div className="glass-card rounded-xl p-4 flex items-center gap-5">
                      <QualityRing score={computeQualityScore(issues, rawRows.length, duplicatesRemoved, nullsFilled)} />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-200">Data Quality Preview</p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            {issues.filter(i=>i.severity==="error").length} errors
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-amber-400" />
                            {issues.filter(i=>i.severity==="warning").length} warnings
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-amber-400" />
                            {duplicatesRemoved} duplicates
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-indigo-400" />
                            {nullsFilled} nulls to fill
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Preview table */}
              {rawRows.length > 0 && stage === "mapping" && (
                <div className="mb-4">
                  <PreviewTable rows={rawRows} columns={columns} />
                </div>
              )}

              {/* Process button */}
              {stage === "mapping" && (
                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleProcess}
                  className="w-full py-4 rounded-2xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2.5"
                  style={{ boxShadow: "0 0 25px rgba(99,102,241,0.25)" }}
                >
                  <Sparkles className="size-5" />
                  Process &amp; Save Data
                  <ChevronRight className="size-4" />
                </motion.button>
              )}
            </motion.key>
          )}
        </AnimatePresence>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-rose-300">Processing Error</p>
                <p className="text-xs text-rose-400/70 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-slate-600 hover:text-slate-300 transition-colors">
                <X className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results (done stage) ─────────────────────────────────────────── */}
        <AnimatePresence>
          {stage === "done" && dataset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* Success banner */}
              <SuccessBanner dataset={dataset} />

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Rows",       val: dataset.totalRows.toLocaleString(),  icon: Database,   color: "text-indigo-400"  },
                  { label: "Clean Rows",        val: dataset.cleanRows.toLocaleString(),  icon: CheckCircle2, color: "text-emerald-400" },
                  { label: "Columns",           val: dataset.totalCols.toString(),         icon: BarChart2,  color: "text-violet-400"  },
                  { label: "File Size",         val: `${dataset.fileSizeKb} KB`,          icon: FileText,   color: "text-cyan-400"    },
                ].map(s => (
                  <div key={s.label}
                    className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <s.icon className={`size-5 shrink-0 ${s.color}`} />
                    <div>
                      <div className="text-lg font-bold text-slate-100">{s.val}</div>
                      <div className="text-[11px] text-slate-500">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quality + AI summary */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Quality score */}
                <div className="glass-card rounded-xl p-5 flex items-center gap-5">
                  <QualityRing score={dataset.qualityScore} />
                  <div>
                    <h3 className="font-semibold text-slate-200 mb-2">Data Quality Score</h3>
                    <div className="space-y-1">
                      {[
                        { label: "Duplicates removed", val: dataset.duplicatesRemoved, color: "text-amber-400" },
                        { label: "Nulls filled",        val: dataset.nullsFilled,       color: "text-indigo-400" },
                        { label: "Validation issues",   val: dataset.issues.length,     color: dataset.issues.some(i=>i.severity==="error") ? "text-rose-400" : "text-emerald-400" },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between text-xs gap-4">
                          <span className="text-slate-500">{r.label}</span>
                          <span className={`font-semibold ${r.color}`}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI summary */}
                <div className="glass-card rounded-xl p-5 border border-indigo-500/15"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.03) 100%)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="size-4 text-indigo-400 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-200">AI Dataset Summary</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{dataset.aiSummary}</p>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpiCards.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="glass-card rounded-xl p-5"
                    style={{ boxShadow: `0 0 20px ${k.glow}10` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500">{k.label}</span>
                      <div className={`size-8 rounded-lg ${k.color} flex items-center justify-center`}
                        style={{ boxShadow: `0 0 12px ${k.glow}` }}>
                        <k.icon className="size-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-slate-100">{k.val}</div>
                  </motion.div>
                ))}
              </div>

              {/* Chart previews */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="size-4 text-violet-400" />
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Sample Chart Previews</h2>
                </div>
                <ChartPreviews dataset={dataset} />
              </div>

              {/* Validation issues (results view) */}
              {dataset.issues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="size-4 text-amber-400" />
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Validation Report</h2>
                  </div>
                  <ValidationPanel issues={dataset.issues} />
                </div>
              )}

              {/* Cleaned data preview */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="size-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Cleaned Data Preview</h2>
                </div>
                <PreviewTable rows={dataset.preview} columns={dataset.columns} />
              </div>

              {/* Availability note */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                <Zap className="size-4 text-indigo-400 shrink-0" />
                <p className="text-sm text-slate-400">
                  <strong className="text-slate-200">Dataset saved to store.</strong> Navigate to{" "}
                  <strong className="text-indigo-300">Dashboard</strong> or{" "}
                  <strong className="text-indigo-300">Analytics</strong> to see your data powering the charts.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {stage === "idle" && !savedDataset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-10 text-slate-600 text-sm"
          >
            Upload a file above to get started with data analysis
          </motion.div>
        )}

      </div>
    </div>
  )
}
