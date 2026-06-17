import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { saasApi } from "@/lib/api"
import GoalTracker from "@/components/saas/GoalTracker"

function GlassSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="text-sm font-bold text-slate-200 mb-3">{title}</div>
      {children}
    </section>
  )
}

export default function Goals() {
  const [simTraffic, setSimTraffic] = useState(1.0)
  const [simConv, setSimConv] = useState(1.0)

  const { data, isLoading, error } = useQuery({
    queryKey: ["saas", "goals"],
    queryFn: () => saasApi.goals().then((r) => r.data),
  })

  const g = data

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">Goals</h1>
        <p className="text-sm text-slate-400 mt-1">Smart tracking with simulation and milestone checkpoints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <GlassSection title="Revenue goal">
          <div className="text-3xl font-black text-indigo-300">${g?.goal_cards?.revenue_goal?.toLocaleString?.() ?? "—"}</div>
          <div className="mt-2 text-sm text-slate-300">Current: ${g?.goal_cards?.current_revenue?.toLocaleString?.()}</div>
        </GlassSection>
        <GlassSection title="Orders goal">
          <div className="text-3xl font-black text-indigo-300">{g?.goal_cards?.orders_goal?.toLocaleString?.() ?? "—"}</div>
          <div className="mt-2 text-sm text-slate-300">Current: {g?.goal_cards?.current_orders?.toLocaleString?.()}</div>
        </GlassSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="Progress">
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : error ? (
            <div className="text-red-300 text-sm">Failed to load goals.</div>
          ) : (
            <div className="space-y-4">
              <GoalTracker label="Revenue" progress={g?.progress_bars?.revenue?.value ?? 0} />
              <GoalTracker label="Orders" progress={g?.progress_bars?.orders?.value ?? 0} />
            </div>
          )}
        </GlassSection>

        <GlassSection title="AI suggestions">
          <div className="space-y-2">
            {(g?.ai_suggestions ?? []).map((s) => (
              <div key={s} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-slate-200">{s}</div>
              </div>
            ))}
          </div>
        </GlassSection>

        <GlassSection title="Goal simulation">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400">Traffic multiplier</div>
              <input
                type="range"
                min={0.8}
                max={1.2}
                step={0.01}
                value={simTraffic}
                onChange={(e) => setSimTraffic(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-slate-200">{simTraffic.toFixed(2)}x</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Conversion rate multiplier</div>
              <input
                type="range"
                min={0.85}
                max={1.1}
                step={0.01}
                value={simConv}
                onChange={(e) => setSimConv(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-slate-200">{simConv.toFixed(2)}x</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Predicted outcome</div>
              <div className="text-sm text-slate-200 mt-1">
                Revenue uplift: +{(simTraffic * simConv * 7.6).toFixed(1)}% (est.)
              </div>
              <div className="text-xs text-slate-500 mt-1">Based on skeleton simulation model.</div>
            </div>
          </div>
        </GlassSection>
      </div>

      <GlassSection title="Milestone tracking">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(g?.milestones ?? []).map((m) => (
            <div key={m.week} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">{m.week}</div>
              <div className="text-lg font-bold text-slate-200">{m.target_revenue_pct}%</div>
              <div className="text-xs text-slate-500 mt-1">Orders target: {m.target_orders_pct}%</div>
            </div>
          ))}
        </div>
      </GlassSection>
    </div>
  )
}

