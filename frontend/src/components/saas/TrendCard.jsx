import React, { memo } from "react"

function formatMoney(n) {
  const num = Number(n || 0)
  return `$${num.toLocaleString()}`
}

function TrendCard({ title, value, delta, revenueImpact, onClick }) {
  const isPositive = Number(delta) >= 0

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/10 transition cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-400">Trend</div>
          <div className="text-sm font-bold text-slate-200 truncate">{title}</div>
        </div>
        <div
          className={
            isPositive ? "text-emerald-300 font-black" : "text-red-300 font-black"
          }
        >
          {value}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        Revenue impact: <span className="text-slate-200 font-semibold">{formatMoney(revenueImpact)}</span>
      </div>
    </button>
  )
}

export default memo(TrendCard)

