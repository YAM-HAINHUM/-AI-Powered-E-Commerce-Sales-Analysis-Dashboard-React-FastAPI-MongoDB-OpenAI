import React from "react"

export default function HealthScore({ health, onDrill }) {
  const overall = Number(health?.overall_score ?? 0)
  const status = health?.status ?? "Average"
  const statusColor = status === "Good" ? "text-emerald-300" : status === "Poor" ? "text-red-300" : "text-amber-300"

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-400">Overall Health</div>
        <div className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
          {overall}
        </div>
        <div className={`text-sm font-bold ${statusColor}`}>Status: {status}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-slate-400">Quick drill-down</div>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {[
            { id: "revenue_score", label: "Revenue" },
            { id: "customer_score", label: "Customer" },
            { id: "churn_score", label: "Churn" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => onDrill?.(f.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
            >
              <span className="text-sm text-slate-200">{f.label}</span>
              <span className="text-xs text-slate-400">Open →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

