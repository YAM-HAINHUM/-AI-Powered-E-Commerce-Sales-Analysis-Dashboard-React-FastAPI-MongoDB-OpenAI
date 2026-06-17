import React, { memo } from "react"

export default memo(function ComparisonChart({ mode, onModeChange }) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400">Select comparison window</div>
      <div className="grid grid-cols-1 gap-2">
        {[
          { id: "this_week_vs_last_week", label: "This week vs last week" },
          { id: "this_month_vs_last_month", label: "This month vs last month" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => onModeChange?.(opt.id)}
            className={
              mode === opt.id
                ? "rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-200 px-3 py-2 text-sm font-bold"
                : "rounded-xl border border-white/10 bg-white/5 text-slate-200 px-3 py-2 text-sm hover:bg-white/10"
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
        {mode === "this_week_vs_last_week"
          ? "Drill-down will focus on the last 7 days momentum." 
          : "Drill-down will focus on the last 30 days trajectory."}
      </div>
    </div>
  )
})

