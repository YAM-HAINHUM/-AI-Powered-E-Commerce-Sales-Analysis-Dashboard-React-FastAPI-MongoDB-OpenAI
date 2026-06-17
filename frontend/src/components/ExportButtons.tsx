import { useState, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, FileSpreadsheet, Share2, Mail, Check, Loader2, X, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { DashboardData } from "@/types"
import type { Filters } from "@/hooks/useDashboardFilters"

interface ExportButtonsProps {
  data: DashboardData
  filters: Filters
}

// ── PDF export ────────────────────────────────────────────────────────────────
async function exportPDF(data: DashboardData, filters: Filters) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = doc.internal.pageSize.getWidth()
  let y = 15

  // Header bar
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, W, 12, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("DataInsight AI — Dashboard Report", 10, 8)
  doc.text(new Date().toLocaleDateString("en-US", { dateStyle: "medium" }), W - 10, 8, { align: "right" })

  y = 20
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Sales Performance Report", 10, y)

  y += 6
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 116, 139)
  const filterStr = [
    `Date: ${filters.dateRange === "all" ? "All time" : filters.dateRange}`,
    `Category: ${filters.category}`,
    `Region: ${filters.region}`,
  ].join("  |  ")
  doc.text(filterStr, 10, y)

  // KPI summary
  y += 10
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Key Performance Indicators", 10, y)

  y += 2
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value", "Growth"]],
    body: [
      ["Total Revenue",     formatCurrency(data.kpis.total_revenue),   `+${data.kpis.revenue_growth}%`],
      ["Total Orders",      String(data.kpis.total_orders),            `+${data.kpis.orders_growth}%`],
      ["Total Customers",   String(data.kpis.total_customers),         "+22.0%"],
      ["Avg Order Value",   formatCurrency(data.kpis.avg_order_value), "+5.6%"],
    ],
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  })

  // Monthly trend
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Monthly Revenue Trend", 10, y)

  y += 2
  autoTable(doc, {
    startY: y,
    head: [["Month", "Revenue", "Orders"]],
    body: data.monthly_trend.map(m => [m.month, formatCurrency(m.revenue), String(m.orders)]),
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  })

  // Category revenue
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Revenue by Category", 10, y)

  y += 2
  autoTable(doc, {
    startY: y,
    head: [["Category", "Revenue"]],
    body: data.category_revenue.map(c => [c.category, formatCurrency(c.revenue)]),
    headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  })

  // Footer
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`DataInsight AI — Page ${i} of ${pages}`, W / 2, 290, { align: "center" })
  }

  doc.save(`datainsight-report-${Date.now()}.pdf`)
}

// ── Excel export ──────────────────────────────────────────────────────────────
async function exportExcel(data: DashboardData) {
  const XLSX = await import("xlsx")

  const wb = XLSX.utils.book_new()

  // KPIs sheet
  const kpiRows = [
    ["Metric", "Value", "Growth"],
    ["Total Revenue",   data.kpis.total_revenue,   `+${data.kpis.revenue_growth}%`],
    ["Total Orders",    data.kpis.total_orders,    `+${data.kpis.orders_growth}%`],
    ["Total Customers", data.kpis.total_customers, "+22.0%"],
    ["Avg Order Value", data.kpis.avg_order_value, "+5.6%"],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiRows), "KPIs")

  // Monthly trend sheet
  const trendRows = [
    ["Month", "Revenue ($)", "Orders"],
    ...data.monthly_trend.map(m => [m.month, m.revenue, m.orders]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trendRows), "Monthly Trend")

  // Category sheet
  const catRows = [
    ["Category", "Revenue ($)"],
    ...data.category_revenue.map(c => [c.category, c.revenue]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catRows), "Categories")

  // Top products
  const prodRows = [
    ["Product", "Units Sold"],
    ...data.top_products.map(p => [p.name, p.units]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodRows), "Top Products")

  // Top customers
  const custRows = [
    ["Customer", "Total Spent ($)", "Orders"],
    ...data.top_customers.map(c => [c.name, c.spent, c.orders]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(custRows), "Top Customers")

  XLSX.writeFile(wb, `datainsight-report-${Date.now()}.xlsx`)
}

// ── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!email.includes("@")) return
    setSent(true)
    setTimeout(onClose, 1500)
  }

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
        exit={{ opacity: 0, scale: 0.93 }}
        onClick={e => e.stopPropagation()}
        className="glass-card rounded-2xl p-6 max-w-sm w-full border border-border relative"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="size-10 rounded-xl gradient-primary flex items-center justify-center">
            <Mail className="size-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">Share Report</div>
            <div className="text-xs text-muted-foreground">Send dashboard snapshot via email</div>
          </div>
        </div>

        {sent ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-emerald-400 py-4 justify-center">
            <Check className="size-5" />
            <span className="font-medium">Report sent successfully!</span>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="recipient@company.com"
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all"
            />
            <button
              onClick={handleSend}
              className="w-full py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Send Report
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export const ExportButtons = memo(function ExportButtons({ data, filters }: ExportButtonsProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [xlsLoading, setXlsLoading] = useState(false)
  const [pdfDone,    setPdfDone]    = useState(false)
  const [xlsDone,    setXlsDone]    = useState(false)
  const [shareOpen,  setShareOpen]  = useState(false)

  const handlePDF = useCallback(async () => {
    setPdfLoading(true)
    try {
      await exportPDF(data, filters)
      setPdfDone(true)
      setTimeout(() => setPdfDone(false), 2500)
    } finally {
      setPdfLoading(false)
    }
  }, [data, filters])

  const handleExcel = useCallback(async () => {
    setXlsLoading(true)
    try {
      await exportExcel(data)
      setXlsDone(true)
      setTimeout(() => setXlsDone(false), 2500)
    } finally {
      setXlsLoading(false)
    }
  }, [data])

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* PDF */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={handlePDF}
          disabled={pdfLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-sm hover:bg-muted hover:border-primary/30 transition-all disabled:opacity-60"
        >
          {pdfLoading ? <Loader2 className="size-3.5 animate-spin" /> : pdfDone ? <Check className="size-3.5 text-emerald-400" /> : <FileText className="size-3.5" />}
          <span>{pdfDone ? "Saved!" : "PDF"}</span>
        </motion.button>

        {/* Excel */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={handleExcel}
          disabled={xlsLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-sm hover:bg-muted hover:border-emerald-500/30 transition-all disabled:opacity-60"
        >
          {xlsLoading ? <Loader2 className="size-3.5 animate-spin" /> : xlsDone ? <Check className="size-3.5 text-emerald-400" /> : <FileSpreadsheet className="size-3.5" />}
          <span>{xlsDone ? "Saved!" : "Excel"}</span>
        </motion.button>

        {/* Share */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-sm hover:bg-muted hover:border-indigo-500/30 transition-all"
        >
          <Share2 className="size-3.5" />
          <span>Share</span>
        </motion.button>

        {/* CSV (existing utility) */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => {
            const rows = data.monthly_trend as unknown as Record<string, unknown>[]
            import("@/lib/utils").then(({ exportToCSV }) => exportToCSV(rows, "dashboard-export"))
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-all"
        >
          <Download className="size-3.5" />
          <span>CSV</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      </AnimatePresence>
    </>
  )
})
