import React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { saasApi } from "@/lib/api"
import TrendCard from "@/components/saas/TrendCard"
import ComparisonChart from "@/components/saas/ComparisonChart"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

function GlassSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="text-sm font-bold text-slate-200 mb-3">{title}</div>
      {children}
    </section>
  )
}

export default function Trends() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const compareMode = searchParams.get("compare") ?? "this_week_vs_last_week"

  const { data, isLoading, error } = useQuery({
    queryKey: ["saas", "trends"],
    queryFn: () => saasApi.trends().then((r) => r.data),
  })

  const trend = data

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
            Trends
          </h1>
          <p className="text-sm text-slate-400 mt-1">Deep analytics with drill-down insights.</p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            Compare: {compareMode === "this_week_vs_last_week" ? "This week vs last week" : "This month vs last month"}
          </span>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {trend?.overview_cards?.rising_products?.slice(0, 3).map((item) => (
          <TrendCard
            key={item.product}
            title={item.product}
            value={`${item.growth_pct}%`}
            delta={item.growth_pct}
            revenueImpact={item.revenue_impact}
            onClick={() => navigate(`/app/trends/${encodeURIComponent(item.product.toLowerCase().replaceAll(" ", "_") )}`)}
          />
        ))}
      </div>

      {/* Main line chart */}
      <GlassSection title="Revenue & Orders over time">
        {isLoading ? (
          <div className="text-slate-400 text-sm">Loading trends...</div>
        ) : error ? (
          <div className="text-red-300 text-sm">Failed to load trends.</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend?.line_chart?.data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title="AI explanation">
          <p className="text-sm text-slate-200">{trend?.ai_explanation ?? ""}</p>
        </GlassSection>

        <GlassSection title="Comparison toggle">
          <ComparisonChart
            mode={compareMode}
            onModeChange={(m) => {
              const url = new URL(window.location.href)
              url.searchParams.set("compare", m)
              navigate(url.pathname + url.search)
            }}
          />
        </GlassSection>

        <GlassSection title="Trending items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="font-semibold pb-2">Product</th>
                  <th className="font-semibold pb-2">Growth %</th>
                  <th className="font-semibold pb-2">Revenue impact</th>
                </tr>
              </thead>
              <tbody>
                {(trend?.trending_items ?? []).map((t) => (
                  <tr
                    key={t.product}
                    className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/app/trends/${encodeURIComponent(t.product.toLowerCase().replaceAll(" ", "_") )}`)}
                  >
                    <td className="py-2 text-slate-200">{t.product}</td>
                    <td className={t.growth_pct >= 0 ? "py-2 text-emerald-300" : "py-2 text-red-300"}>{t.growth_pct}%</td>
                    <td className="py-2 text-slate-400">${t.revenue_impact.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassSection>
      </div>
    </div>
  )
}

