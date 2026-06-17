import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

import { saasApi } from "@/lib/api"

function GlassSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="text-sm font-bold text-slate-200 mb-3">{title}</div>
      {children}
    </section>
  )
}

export default function AlertDetail() {
  const { alertId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["saas", "alerts"],
    queryFn: () => saasApi.alerts().then((r) => r.data),
  })

  const detail = data?.detail_map?.[alertId]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
        >
          ← Back
        </button>
        <div className="text-xs text-slate-400">Root-cause analysis</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="Full explanation">
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : (
            <>
              <div className="text-xl font-black text-slate-200">{detail?.title ?? ""}</div>
              <div className="mt-2 text-sm text-slate-400">{detail?.full_explanation ?? ""}</div>
              <div className="mt-3 text-xs inline-flex px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-300">Severity: {detail?.severity}</div>
            </>
          )}
        </GlassSection>

        <GlassSection title="Affected metrics">
          <div className="flex flex-wrap gap-2">
            {(detail?.affected_metrics ?? []).map((m) => (
              <div key={m} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                {m}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500">Occurred at: {detail?.occurred_at}</div>
        </GlassSection>

        <GlassSection title="Impact visualization">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detail?.impact_chart?.data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="phase" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)" }} />
                <Bar dataKey="value" fill="#f97316" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassSection>
      </div>

      <GlassSection title="Root cause analysis">
        <p className="text-sm text-slate-200">{detail?.root_cause_analysis ?? ""}</p>
      </GlassSection>

      <GlassSection title="Alert settings shortcut">
        <div className="text-sm text-slate-300">
          Current sensitivity: <span className="text-slate-200 font-bold">{detail?.alert_settings?.sensitivity ?? "medium"}</span>
        </div>
      </GlassSection>
    </div>
  )
}

