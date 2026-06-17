import React from "react"

function severityColor(sev) {
  if (sev === "critical") return "bg-red-500/15 border-red-500/25 text-red-200"
  if (sev === "warning") return "bg-amber-500/15 border-amber-500/25 text-amber-200"
  return "bg-emerald-500/15 border-emerald-500/25 text-emerald-200"
}

export default function AlertItem({ alert, onClick }) {
  const sev = alert?.severity ?? "info"
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border ${severityColor(sev)} backdrop-blur-xl p-4 hover:bg-white/10 transition`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-200/80">{sev.toUpperCase()}</div>
          <div className="text-sm font-bold truncate">{alert?.title}</div>
        </div>
        <div className="text-xs text-slate-200/80">{alert?.occurred_at}</div>
      </div>
      <div className="mt-2 text-sm text-slate-200/90">{alert?.explanation ?? alert?.full_explanation ?? ""}</div>
    </button>
  )
}

