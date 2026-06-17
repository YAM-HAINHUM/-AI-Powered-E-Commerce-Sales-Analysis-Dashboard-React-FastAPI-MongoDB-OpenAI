import { useState } from "react"
import { motion } from "framer-motion"
import {
  FileText, RefreshCw, Loader2, Info, Download, Sparkles, FileDown,
  BarChart3, CheckCircle2
} from "lucide-react"
import { advancedApi } from "@/lib/api"

export default function AIReportsPage() {
  const [reportType, setReportType] = useState<"weekly" | "monthly">("monthly")
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true)
    try {
      const response = await advancedApi.downloadReport()
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `ecommerce_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setReportGenerated(true)
    } catch (err) {
      console.error("PDF generation failed:", err)
      alert("Failed to download PDF report. Make sure backend is running.")
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true)
    try {
      const response = await advancedApi.downloadExcel()
      const blob = new Blob([response.data], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `ecommerce_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setReportGenerated(true)
    } catch (err) {
      console.error("Excel generation failed:", err)
      alert("Failed to download CSV spreadsheet. Verify backend connection.")
    } finally {
      setIsDownloadingExcel(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="size-6 text-indigo-400" /> AI Auto Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compile operational statistics, revenue curves, and performance targets into clean PDF or spreadsheet CSV exports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Panel */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 bg-slate-900/30 md:col-span-1 space-y-5">
          <h3 className="font-bold text-sm text-slate-200 border-b border-white/[0.05] pb-2 shrink-0">Report Configurations</h3>
          
          <div className="space-y-4">
            {/* Period selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-semibold uppercase">Report Interval</label>
              <div className="flex flex-col gap-2">
                {[
                  { id: "weekly", label: "Weekly Operational Summary" },
                  { id: "monthly", label: "Monthly Executive Performance" }
                ].map(r => (
                  <label
                    key={r.id}
                    onClick={() => { setReportType(r.id as any); setReportGenerated(false) }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                      reportType === r.id
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]"
                        : "border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      checked={reportType === r.id}
                      onChange={() => {}}
                      className="hidden"
                    />
                    <FileText className="size-4 shrink-0" />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Inclusions checklist */}
            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-semibold uppercase">AI Modules Included</label>
              <div className="space-y-2 text-xs font-medium text-slate-400">
                {[
                  "Executive Sales summary KPIs",
                  "Monthly sales curves & forecasts",
                  "Top product grading matrices",
                  "Dynamic pricing adjustments",
                  "Customer behavioral cohorts RFM"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/30 md:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl w-fit">
              <Sparkles className="size-3.5 animate-pulse" /> AI Agent Ready
            </div>
            
            <h2 className="text-lg font-bold text-slate-200">
              Ready to generate {reportType === "weekly" ? "Weekly" : "Monthly"} Analytics Report
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our automated report script aggregates transactional tables, compiles predictive forecast trajectories, flags Z-score drops/spikes, and details strategic marketing/inventory recommendations. Select your format preference below to compile the file.
            </p>
          </div>

          {reportGenerated && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Consolidated report generated and downloaded successfully.
            </div>
          )}

          {/* Export Action strip */}
          <div className="flex items-center gap-3 w-full flex-wrap">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || isDownloadingExcel}
              className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-primary hover:opacity-90 disabled:opacity-60 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-500/15"
            >
              {isDownloadingPdf ? (
                <><Loader2 className="size-4 animate-spin" /> Compiling PDF...</>
              ) : (
                <><FileDown className="size-4" /> Download PDF Report</>
              )}
            </button>

            <button
              onClick={handleDownloadExcel}
              disabled={isDownloadingPdf || isDownloadingExcel}
              className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-60 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              {isDownloadingExcel ? (
                <><Loader2 className="size-4 animate-spin text-emerald-400" /> Exporting CSV...</>
              ) : (
                <><Download className="size-4 text-emerald-400" /> Export CSV Spreadsheet</>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-500 leading-relaxed shrink-0">
            <Info className="size-4 text-slate-600 shrink-0 mt-0.5" />
            <span>Note: CSV reports can be directly imported into Microsoft Excel, Google Sheets, or Apple Numbers. Visual graphs and charts are compiled exclusively inside PDF formats.</span>
          </div>

        </div>

      </div>
    </motion.div>
  )
}
