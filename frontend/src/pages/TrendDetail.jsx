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

export default function TrendDetail() {
  const { trendId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["saas", "trends"],
    queryFn: () => saasApi.trends().then((r) => r.data),
  })

  const mapKey = String(trendId || "").toLowerCase().includes("electronic") ? "electronics" : "electronics"
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
        <div className="text-xs text-slate-400">Drill-down view</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="Product/Category trend graph">
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detail?.graph?.data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassSection>

        <GlassSection title="Growth %">
          <div className="text-4xl font-black text-indigo-300">{detail?.growth_pct?.toFixed?.(1) ?? "—"}%</div>
          <p className="text-sm text-slate-400 mt-2">Computed from latest window vs previous baseline.</p>
        </GlassSection>

        <GlassSection title="Time-based breakdown">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Last 7 days</div>
              <div className="text-lg font-bold text-slate-200">${detail?.time_based_breakdown?.last7?.revenue?.toLocaleString?.()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Previous 7 days</div>
              <div className="text-lg font-bold text-slate-200">${detail?.time_based_breakdown?.prev7?.revenue?.toLocaleString?.()}</div>
            </div>
          </div>
        </GlassSection>
      </div>

      <GlassSection title="AI trend explanation">
        <p className="text-sm text-slate-200">{detail?.ai_explanation ?? ""}</p>
      </GlassSection>
    </div>
  )
}

