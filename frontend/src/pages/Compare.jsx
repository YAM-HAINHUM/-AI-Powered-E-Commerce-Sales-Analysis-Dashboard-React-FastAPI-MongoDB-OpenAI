import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
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

export default function Compare() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ["saas", "compare"],
    queryFn: () => saasApi.compare().then((r) => r.data),
  })

  const c = data

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">Compare</h1>
        <p className="text-sm text-slate-400 mt-1">Advanced comparison with difference metrics and drill-down.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="AI Summary">
          <p className="text-sm text-slate-200">{c?.ai_summary ?? ""}</p>
        </GlassSection>
        <GlassSection title="Week comparison">
          <div className="space-y-2">
            {c?.week?.metrics && (
              <>
                <div className="text-sm text-slate-400">Revenue %</div>
                <div className={c.week.metrics.revenue.pct_change >= 0 ? "text-lg font-black text-emerald-300" : "text-lg font-black text-red-300"}>
                  {c.week.metrics.revenue.pct_change}%
                </div>
              </>
            )}
          </div>
        </GlassSection>
        <GlassSection title="Month comparison">
          <div className="space-y-2">
            {c?.month?.metrics && (
              <>
                <div className="text-sm text-slate-400">Revenue %</div>
                <div className={c.month.metrics.revenue.pct_change >= 0 ? "text-lg font-black text-emerald-300" : "text-lg font-black text-red-300"}>
                  {c.month.metrics.revenue.pct_change}%
                </div>
              </>
            )}
          </div>
        </GlassSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <GlassSection title="Side-by-side charts (week)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={c?.week?.side_by_side ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="metric" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)" }} />
                <Bar dataKey="prev" fill="#94a3b8" radius={[10, 10, 0, 0]} />
                <Bar dataKey="this" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassSection>
        <GlassSection title="Side-by-side charts (month)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={c?.month?.side_by_side ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="metric" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)" }} />
                <Bar dataKey="prev" fill="#94a3b8" radius={[10, 10, 0, 0]} />
                <Bar dataKey="this" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassSection>
      </div>

      <GlassSection title="Drill-down comparison">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-bold text-slate-200 mb-2">Product-level</div>
            <div className="space-y-2">
              {(c?.drill_down?.product_level ?? []).map((p) => (
                <button
                  key={p.product}
                  onClick={() => navigate(`/app/compare/${encodeURIComponent(p.product.toLowerCase().replaceAll(" ", "_"))}`)}
                  className="w-full text-left px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-200">{p.product}</div>
                    <div className={p.pct_change >= 0 ? "text-emerald-300 text-sm font-black" : "text-red-300 text-sm font-black"}>
                      {p.pct_change}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-bold text-slate-200 mb-2">Category-level</div>
            <div className="space-y-2">
              {(c?.drill_down?.category_level ?? []).map((p) => (
                <button
                  key={p.category}
                  onClick={() => navigate(`/app/compare/${encodeURIComponent(p.category.toLowerCase().replaceAll(" ", "_"))}`)}
                  className="w-full text-left px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-200">{p.category}</div>
                    <div className={p.pct_change >= 0 ? "text-emerald-300 text-sm font-black" : "text-red-300 text-sm font-black"}>
                      {p.pct_change}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassSection>
    </div>
  )
}

