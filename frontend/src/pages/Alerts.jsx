import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { saasApi } from "@/lib/api"
import AlertItem from "@/components/saas/AlertItem"

function GlassSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="text-sm font-bold text-slate-200 mb-3">{title}</div>
      {children}
    </section>
  )
}

export default function Alerts() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ["saas", "alerts"],
    queryFn: () => saasApi.alerts().then((r) => r.data),
  })

  const a = data

  const renderList = (items) => (
    <div className="space-y-2">
      {(items ?? []).map((it) => (
        <AlertItem key={it.id} alert={it} onClick={() => navigate(`/app/alerts/${it.id}`)} />
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">Alerts</h1>
        <p className="text-sm text-slate-400 mt-1">Smart monitoring with root-cause context and impact visualization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassSection title={`Critical (${a?.alerts?.total ?? 0})`}>
          {isLoading ? <div className="text-slate-400 text-sm">Loading...</div> : error ? <div className="text-red-300 text-sm">Failed.</div> : renderList(a?.alerts?.critical)}
        </GlassSection>
        <GlassSection title="Warnings">
          {renderList(a?.alerts?.warning)}
        </GlassSection>
        <GlassSection title="Info">
          {renderList(a?.alerts?.info)}
        </GlassSection>
      </div>
    </div>
  )
}

