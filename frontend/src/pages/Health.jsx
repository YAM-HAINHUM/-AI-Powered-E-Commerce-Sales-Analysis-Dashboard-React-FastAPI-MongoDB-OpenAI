import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

import { saasApi } from "@/lib/api"
import HealthScore from "@/components/saas/HealthScore"

function GlassSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="text-sm font-bold text-slate-200 mb-3">{title}</div>
      {children}
    </section>
  )
}

export default function Health() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ["saas", "health"],
    queryFn: () => saasApi.health().then((r) => r.data),
  })

  const h = data

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">Health</h1>
        <p className="text-sm text-slate-400 mt-1">Business score with factor breakdown and historical context.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="Overall Health Score">
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : error ? (
            <div className="text-red-300 text-sm">Failed to load health.</div>
          ) : (
            <HealthScore health={h?.health} onDrill={(factorId) => navigate(`/app/health/${factorId}`)} />
          )}
        </GlassSection>

        <GlassSection title="Factor Breakdown">
          <div className="space-y-3">
            {[
              { id: "revenue_score", label: "Revenue score", val: h?.health?.factors?.revenue_score },
              { id: "customer_score", label: "Customer score", val: h?.health?.factors?.customer_score },
              { id: "churn_score", label: "Churn score", val: h?.health?.factors?.churn_score },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => navigate(`/app/health/${f.id}`)}
                className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-200">{f.label}</div>
                  <div className="text-2xl font-black text-indigo-300">{f.val ?? "—"}</div>
                </div>
                <div className="mt-2 text-xs text-slate-500">Click for detail</div>
              </button>
            ))}
          </div>
        </GlassSection>

        <GlassSection title="AI explanation">
          <p className="text-sm text-slate-200">{h?.health?.ai_explanation ?? ""}</p>
          <div className="mt-4 space-y-2">
            {(h?.health?.improvements ?? []).map((im) => (
              <div key={im.title} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-bold text-slate-200">{im.title}</div>
                <div className="text-sm text-slate-400 mt-1">{im.detail}</div>
              </div>
            ))}
          </div>
        </GlassSection>
      </div>

      <GlassSection title="Historical Health Trend">
        {isLoading ? (
          <div className="text-slate-400 text-sm">Loading...</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={h?.historical_health_trend?.data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)" }} />
                <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassSection>
    </div>
  )
}

