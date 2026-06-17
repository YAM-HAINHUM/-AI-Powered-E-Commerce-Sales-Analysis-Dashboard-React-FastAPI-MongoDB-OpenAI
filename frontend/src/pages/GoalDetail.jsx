import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

import { saasApi } from "@/lib/api"

function GlassSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="text-sm font-bold text-slate-200 mb-3">{title}</div>
      {children}
    </section>
  )
}

export default function GoalDetail() {
  const { goalId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["saas", "goals"],
    queryFn: () => saasApi.goals().then((r) => r.data),
  })

  const mapKey = (goalId || "revenue_goal").toLowerCase().includes("order") ? "orders_goal" : "revenue_goal"
  const detail = data?.detail_map?.[mapKey]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
        >
          ← Back
        </button>
        <div className="text-xs text-slate-400">Goal drill-down</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="Daily progress">
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detail?.daily_progress_chart?.data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassSection>

        <GlassSection title="Remaining target">
          <div className="text-3xl font-black text-indigo-300">{detail?.remaining_target?.revenue_remaining ? `$${detail.remaining_target.revenue_remaining.toLocaleString()}` : detail?.remaining_target?.orders_remaining ?? "—"}</div>
          <div className="text-sm text-slate-400 mt-2">Time left: {detail?.time_left_days ?? 21} days</div>
        </GlassSection>

        <GlassSection title="AI suggestion">
          <div className="text-sm text-slate-200">{detail?.ai_suggestion ?? ""}</div>
        </GlassSection>
      </div>

      <GlassSection title="Milestones">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(detail?.milestones ?? []).map((m, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">{m.week || `Wk ${idx + 1}`}</div>
              <div className="text-lg font-bold text-slate-200">{m.target_revenue_pct ?? m.target_orders_pct ?? 0}%</div>
            </div>
          ))}
        </div>
      </GlassSection>
    </div>
  )
}

