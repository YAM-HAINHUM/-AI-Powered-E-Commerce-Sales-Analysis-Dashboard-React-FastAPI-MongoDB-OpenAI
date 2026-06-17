import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileDown, FileText, FileSpreadsheet, Download, Mail,
  CheckCircle2, Clock, Calendar, Loader2, Share2,
  X, Check, RefreshCw, Sparkles, BarChart2, Users,
  TrendingUp, Database, Zap,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useDashboard } from "@/hooks/useDashboard"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  gradient: string
  sections: string[]
  estimatedSize: string
}

interface HistoryEntry {
  id: string
  name: string
  format: "pdf" | "xlsx" | "csv"
  generatedAt: string
  size: string
  status: "ready" | "generating" | "failed"
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TEMPLATES: ReportTemplate[] = [
  {
    id: "executive",
    name: "Executive Summary",
    description: "High-level KPIs, revenue trend, and strategic insights for leadership.",
    icon: Sparkles,
    gradient: "from-indigo-500 to-violet-600",
    sections: ["KPI Overview", "Revenue Trend", "Top Customers", "AI Insights"],
    estimatedSize: "~250 KB",
  },
  {
    id: "sales",
    name: "Sales Performance",
    description: "Detailed revenue breakdown, category analysis, and product rankings.",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-600",
    sections: ["Monthly Trend", "Category Revenue", "Best Products", "Orders Analysis"],
    estimatedSize: "~380 KB",
  },
  {
    id: "customer",
    name: "Customer Analytics",
    description: "Customer segmentation, top buyers, retention metrics, and churn signals.",
    icon: Users,
    gradient: "from-cyan-500 to-blue-600",
    sections: ["Top Customers", "Segmentation", "Churn Risk", "Lifetime Value"],
    estimatedSize: "~310 KB",
  },
  {
    id: "operations",
    name: "Operations Report",
    description: "Full data export with all tables — suitable for BI tools import.",
    icon: Database,
    gradient: "from-amber-500 to-orange-600",
    sections: ["All KPIs", "All Trends", "All Products", "All Customers"],
    estimatedSize: "~1.2 MB",
  },
]

const MOCK_HISTORY: HistoryEntry[] = [
  { id: "h1", name: "Executive Summary",    format: "pdf",  generatedAt: "Today, 09:14 AM",      size: "248 KB", status: "ready" },
  { id: "h2", name: "Sales Performance",    format: "xlsx", generatedAt: "Today, 08:00 AM",      size: "374 KB", status: "ready" },
  { id: "h3", name: "Customer Analytics",   format: "pdf",  generatedAt: "Yesterday, 06:30 PM",  size: "302 KB", status: "ready" },
  { id: "h4", name: "Operations Report",    format: "csv",  generatedAt: "Jun 18, 2024, 02:15 PM", size: "1.1 MB",status: "ready" },
]

const SCHEDULE_OPTIONS = ["Daily at 8:00 AM", "Weekly on Monday", "Monthly on the 1st", "Custom…"]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtIcon = (fmt: HistoryEntry["format"]) => {
  if (fmt === "pdf")  return <FileText       className="size-4 text-rose-400"    />
  if (fmt === "xlsx") return <FileSpreadsheet className="size-4 text-emerald-400" />
  return                     <Download        className="size-4 text-indigo-400"  />
}

const MOCK_KPI_DATA = {
  kpis: { total_revenue: 48320, total_orders: 342, total_customers: 87, avg_order_value: 284, revenue_growth: 18.3, orders_growth: 12.1 },
  monthly_trend: [
    { month:"Jan",revenue:3200,orders:22 },{ month:"Feb",revenue:4100,orders:28 },
    { month:"Mar",revenue:3800,orders:25 },{ month:"Apr",revenue:5200,orders:36 },
    { month:"May",revenue:4600,orders:31 },{ month:"Jun",revenue:6100,orders:42 },
    { month:"Jul",revenue:5400,orders:38 },{ month:"Aug",revenue:7200,orders:50 },
    { month:"Sep",revenue:6300,orders:44 },{ month:"Oct",revenue:8100,orders:56 },
    { month:"Nov",revenue:7400,orders:51 },{ month:"Dec",revenue:9100,orders:62 },
  ],
  category_revenue: [
    { category:"Electronics",revenue:18200 },{ category:"Fashion",revenue:12100 },
    { category:"Home & Garden",revenue:9800 },{ category:"Sports",revenue:5400 },
    { category:"Books",revenue:2820 },
  ],
  top_products:  [
    { name:"Wireless Headphones",units:48 },{ name:"Smart Watch",units:39 },
    { name:"Running Shoes",units:34 },{ name:"Coffee Maker",units:28 },
  ],
  top_customers: [
    { name:"Alice Johnson",spent:4820,orders:14 },{ name:"Bob Martinez",spent:3960,orders:11 },
    { name:"Carol White",spent:3240,orders:9 },{ name:"David Kim",spent:2780,orders:8 },
  ],
}

// ── PDF export ────────────────────────────────────────────────────────────────
async function generatePDF(templateId: string) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const d = MOCK_KPI_DATA
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, W, 14, "F")
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold")
  doc.text("DataInsight AI — " + (TEMPLATES.find(t => t.id === templateId)?.name ?? "Report"), 10, 9)
  doc.text(new Date().toLocaleDateString("en-US", { dateStyle: "long" }), W - 10, 9, { align: "right" })

  doc.setTextColor(15, 23, 42); doc.setFontSize(18); doc.setFont("helvetica", "bold")
  doc.text(TEMPLATES.find(t => t.id === templateId)?.name ?? "Report", 10, 26)
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139)
  doc.text(`Generated: ${new Date().toLocaleString()}  |  DataInsight AI Platform`, 10, 33)

  // KPIs
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42)
  doc.text("Key Performance Indicators", 10, 44)
  autoTable(doc, {
    startY: 47,
    head: [["Metric", "Value", "Growth"]],
    body: [
      ["Total Revenue",   formatCurrency(d.kpis.total_revenue),   `+${d.kpis.revenue_growth}%`],
      ["Total Orders",    String(d.kpis.total_orders),            `+${d.kpis.orders_growth}%`],
      ["Total Customers", String(d.kpis.total_customers),         "+22.0%"],
      ["Avg Order Value", formatCurrency(d.kpis.avg_order_value), "+5.6%"],
    ],
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  })

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Monthly trend
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42)
  doc.text("Monthly Revenue Trend", 10, y1)
  autoTable(doc, {
    startY: y1 + 3,
    head: [["Month", "Revenue", "Orders"]],
    body: d.monthly_trend.map(m => [m.month, formatCurrency(m.revenue), String(m.orders)]),
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  })

  const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Category revenue
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42)
  doc.text("Revenue by Category", 10, y2)
  autoTable(doc, {
    startY: y2 + 3,
    head: [["Category", "Revenue"]],
    body: d.category_revenue.map(c => [c.category, formatCurrency(c.revenue)]),
    headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  })

  // Footer
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setTextColor(148, 163, 184)
    doc.text(`DataInsight AI  ·  Page ${i} of ${pages}`, W / 2, 290, { align: "center" })
  }

  doc.save(`datainsight-${templateId}-${Date.now()}.pdf`)
}

// ── Excel export ──────────────────────────────────────────────────────────────
async function generateExcel(templateId: string) {
  const XLSX = await import("xlsx")
  const d = MOCK_KPI_DATA
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Metric", "Value", "Growth"],
    ["Total Revenue",   d.kpis.total_revenue,   `+${d.kpis.revenue_growth}%`],
    ["Total Orders",    d.kpis.total_orders,    `+${d.kpis.orders_growth}%`],
    ["Total Customers", d.kpis.total_customers, "+22.0%"],
    ["Avg Order Value", d.kpis.avg_order_value, "+5.6%"],
  ]), "KPIs")

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Month", "Revenue ($)", "Orders"],
    ...d.monthly_trend.map(m => [m.month, m.revenue, m.orders]),
  ]), "Monthly Trend")

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Category", "Revenue ($)"],
    ...d.category_revenue.map(c => [c.category, c.revenue]),
  ]), "Categories")

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Product", "Units"],
    ...d.top_products.map(p => [p.name, p.units]),
  ]), "Top Products")

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Customer", "Spent ($)", "Orders"],
    ...d.top_customers.map(c => [c.name, c.spent, c.orders]),
  ]), "Top Customers")

  XLSX.writeFile(wb, `datainsight-${templateId}-${Date.now()}.xlsx`)
}

// ── CSV export ────────────────────────────────────────────────────────────────
function generateCSV() {
  const d = MOCK_KPI_DATA
  const rows = [
    ["Month", "Revenue", "Orders"],
    ...d.monthly_trend.map(m => [m.month, m.revenue, m.orders]),
  ]
  const csv = rows.map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url
  a.download = `datainsight-monthly-${Date.now()}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({ reportName, onClose }: { reportName: string; onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email.includes("@")) return
    setSending(true)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        onClick={e => e.stopPropagation()}
        className="glass-card rounded-2xl p-7 max-w-md w-full border border-border relative"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-xl gradient-primary flex items-center justify-center">
            <Mail className="size-5 text-white" />
          </div>
          <div>
            <div className="font-bold">Share Report</div>
            <div className="text-xs text-muted-foreground">{reportName}</div>
          </div>
        </div>

        {sent ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="flex flex-col items-center justify-center py-6 gap-2">
            <CheckCircle2 className="size-10 text-emerald-400" />
            <p className="font-semibold text-emerald-300">Sent successfully!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Hi, here's the latest analytics report…"
                rows={3}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all resize-none" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="size-3.5 text-indigo-400" />
              Report will be attached as PDF
            </div>
            <button onClick={handleSend} disabled={sending || !email.includes("@")}
              className="w-full py-3 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {sending ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : <><Mail className="size-4" /> Send Report</>}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({
  template, onExport,
}: {
  template: ReportTemplate
  onExport: (id: string, fmt: "pdf" | "xlsx" | "csv") => void
}) {
  const [loading, setLoading] = useState<"pdf" | "xlsx" | "csv" | null>(null)
  const [done, setDone]       = useState<"pdf" | "xlsx" | "csv" | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const Icon = template.icon

  const handleExport = async (fmt: "pdf" | "xlsx" | "csv") => {
    setLoading(fmt); setDone(null)
    await onExport(template.id, fmt)
    setLoading(null); setDone(fmt)
    setTimeout(() => setDone(null), 2500)
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="glass-card rounded-2xl p-5 flex flex-col gap-4 group"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`size-11 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center`}
            style={{ boxShadow: "0 0 20px rgba(99,102,241,0.2)" }}>
            <Icon className="size-5 text-white" />
          </div>
          <span className="text-[11px] text-muted-foreground border border-border bg-muted/30 px-2 py-0.5 rounded-lg">
            {template.estimatedSize}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-sm mb-1">{template.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
        </div>

        {/* Sections */}
        <div className="flex flex-wrap gap-1.5">
          {template.sections.map(s => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
              {s}
            </span>
          ))}
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          {(["pdf", "xlsx", "csv"] as const).map(fmt => (
            <motion.button
              key={fmt}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleExport(fmt)}
              disabled={!!loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 ${
                done === fmt
                  ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                  : loading === fmt
                  ? "bg-muted border-border text-muted-foreground"
                  : "border-border hover:bg-muted hover:border-primary/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {loading === fmt ? <Loader2 className="size-3 animate-spin" /> :
               done === fmt    ? <Check   className="size-3 text-emerald-400" /> :
               fmt === "pdf"   ? <FileText       className="size-3" /> :
               fmt === "xlsx"  ? <FileSpreadsheet className="size-3" /> :
                                 <Download        className="size-3" />}
              {done === fmt ? "Done!" : fmt.toUpperCase()}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShareOpen(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all"
          >
            <Share2 className="size-3" /> Share
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {shareOpen && (
          <ShareModal reportName={template.name} onClose={() => setShareOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const { data: dashData } = useDashboard()
  const [schedule, setSchedule] = useState(SCHEDULE_OPTIONS[0])
  const [scheduleEmail, setScheduleEmail] = useState("")
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(MOCK_HISTORY)

  const handleExport = useCallback(async (templateId: string, fmt: "pdf" | "xlsx" | "csv") => {
    if (fmt === "pdf")  await generatePDF(templateId)
    if (fmt === "xlsx") await generateExcel(templateId)
    if (fmt === "csv")  generateCSV()

    // Add to history
    const tmpl = TEMPLATES.find(t => t.id === templateId)!
    setHistory(prev => [{
      id: `gen-${Date.now()}`,
      name: tmpl.name,
      format: fmt,
      generatedAt: `Just now`,
      size: fmt === "csv" ? "~120 KB" : fmt === "xlsx" ? `~${tmpl.estimatedSize}` : tmpl.estimatedSize,
      status: "ready",
    }, ...prev].slice(0, 8))
  }, [])

  const handleSaveSchedule = useCallback(() => {
    if (!scheduleEmail.includes("@")) return
    setScheduleSaved(true)
    setTimeout(() => setScheduleSaved(false), 3000)
  }, [scheduleEmail])

  const kpis = dashData?.kpis
  const summaryCards = useMemo(() => kpis ? [
    { label: "Total Revenue",   value: formatCurrency(kpis.total_revenue),           color: "text-indigo-400" },
    { label: "Total Orders",    value: kpis.total_orders.toLocaleString(),            color: "text-violet-400" },
    { label: "Total Customers", value: kpis.total_customers.toLocaleString(),         color: "text-cyan-400"   },
    { label: "Avg Order Value", value: formatCurrency(kpis.avg_order_value),          color: "text-emerald-400"},
  ] : [], [kpis])

  return (
    <div className="p-6 space-y-8 max-w-7xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center"
            style={{ boxShadow: "0 0 20px rgba(239,68,68,0.35)" }}>
            <FileDown className="size-4 text-white" />
          </div>
          Reports & Exports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate, schedule, and share professional reports — PDF, Excel, CSV
        </p>
      </motion.div>

      {/* ── Live KPI snapshot ────────────────────────────────────────────── */}
      {summaryCards.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="size-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current Snapshot</h2>
            <span className="text-[11px] bg-muted border border-border px-2 py-0.5 rounded-full text-muted-foreground">
              Will be included in reports
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summaryCards.map(c => (
              <div key={c.label} className="glass-card rounded-xl px-4 py-3.5">
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className={`text-xl font-black mt-0.5 ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Report templates ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileDown className="size-4 text-rose-400" />
          <h2 className="font-semibold">Report Templates</h2>
          <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
            {TEMPLATES.length} available
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map(tmpl => (
            <TemplateCard key={tmpl.id} template={tmpl} onExport={handleExport} />
          ))}
        </div>
      </div>

      {/* ── Quick export ─────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 border border-indigo-500/15">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="size-4 text-indigo-400" />
          <h2 className="font-semibold">Quick Export</h2>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            One-click
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { fmt: "pdf" as const,  label: "Full PDF Report",        desc: "All KPIs + trends + categories", icon: FileText,        gradient: "from-rose-500 to-red-600" },
            { fmt: "xlsx" as const, label: "Excel Workbook",         desc: "5 sheets, ready for analysis",   icon: FileSpreadsheet, gradient: "from-emerald-500 to-teal-600" },
            { fmt: "csv" as const,  label: "CSV Data Export",        desc: "Monthly trend raw data",         icon: Download,        gradient: "from-indigo-500 to-violet-600" },
          ].map(({ fmt, label, desc, icon: Icon, gradient }) => {
            const [loading, setLoading] = useState(false)
            const [done, setDone] = useState(false)
            const handleClick = async () => {
              setLoading(true); setDone(false)
              await handleExport("executive", fmt)
              setLoading(false); setDone(true)
              setTimeout(() => setDone(false), 2500)
            }
            return (
              <motion.button key={fmt}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleClick} disabled={loading}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left disabled:opacity-60 group"
              >
                <div className={`size-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                  {loading ? <Loader2 className="size-5 text-white animate-spin" /> :
                   done    ? <Check   className="size-5 text-white" /> :
                             <Icon   className="size-5 text-white" />}
                </div>
                <div>
                  <div className="font-semibold text-sm">{done ? "Downloaded!" : label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Scheduled reports ────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="size-4 text-violet-400" />
          <h2 className="font-semibold">Scheduled Reports</h2>
          <span className="text-xs text-muted-foreground">Auto-generate and email on a schedule</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Frequency</label>
            <select
              value={schedule}
              onChange={e => setSchedule(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
            >
              {SCHEDULE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deliver to</label>
            <input
              type="email"
              value={scheduleEmail}
              onChange={e => setScheduleEmail(e.target.value)}
              placeholder="team@company.com"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex items-end">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSaveSchedule}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                scheduleSaved
                  ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                  : "gradient-primary text-white hover:opacity-90"
              }`}
            >
              {scheduleSaved
                ? <><Check className="size-4" /> Schedule Saved!</>
                : <><Clock className="size-4" /> Save Schedule</>}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Report history ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Report History</h2>
          <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
            {history.length} reports
          </span>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {history.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group"
              >
                <div className="shrink-0">{fmtIcon(entry.format)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{entry.name}</div>
                  <div className="text-xs text-muted-foreground">{entry.generatedAt} · {entry.size}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium uppercase border shrink-0 ${
                  entry.format === "pdf"  ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                  entry.format === "xlsx" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                           "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                }`}>{entry.format}</span>
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
                  title="Re-download"
                  onClick={() => handleExport("executive", entry.format)}
                >
                  <RefreshCw className="size-3.5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
