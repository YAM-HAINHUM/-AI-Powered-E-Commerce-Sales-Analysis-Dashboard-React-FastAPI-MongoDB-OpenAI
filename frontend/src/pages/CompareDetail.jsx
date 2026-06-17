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

export default function CompareDetail() {
  const { compareId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["saas", "compare"],
    queryFn: () => saasApi.compare().then((r) => r.data),
  })

  const key = (() => {
    const s = String(compareId || "").toLowerCase()
    if (s.includes("wireless")) return "product_wireless_earbuds"
    if (s.includes("electronics")) return "product_wireless_earbuds"
    return "product_wireless_earbuds"
  })()

  const detail = data?.detail_map?.[key]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
        >
          ← Back
        </button>
        <div className="text-xs text-slate-400">Comparison drill-down</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="AI summary">
          {isLoading ? <div className="text-slate-400 text-sm">Loading...</div> : <div className="text-sm text-slate-200">{detail?.ai_explanation ?? ""}</div>}
        </GlassSection>
        <GlassSection title="Impact visualization">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detail?.impact_chart?.data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="phase" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)" }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassSection>
        <GlassSection title="Difference metrics">
          <div className="space-y-2 text-sm text-slate-300">
            <div>Before: <span className="text-slate-200 font-bold">{detail?.impact_chart?.data?.[0]?.value ?? "—"}</span></div>
            <div>After: <span className="text-slate-200 font-bold">{detail?.impact_chart?.data?.[1]?.value ?? "—"}</span></div>
            <div className="text-xs text-slate-500">Computed by deterministic backend skeleton.</div>
          </div>
        </GlassSection>
      </div>
    </div>
  )
}

