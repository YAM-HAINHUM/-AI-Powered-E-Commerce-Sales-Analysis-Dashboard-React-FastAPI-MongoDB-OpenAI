import React from "react"

export default function GoalTracker({ label, progress }) {
  const pct = Math.max(0, Math.min(100, Number(progress || 0)))
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 45 ? "bg-indigo-500" : "bg-rose-500"

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-200 font-semibold">{label}</div>
        <div className="text-xs text-slate-400">{pct.toFixed(1)}%</div>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`${color} h-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

