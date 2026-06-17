import React from "react";
import { Zap, FileText, Bot, Sparkline } from "lucide-react";

function SparklineMini({ values, color = "#8b5cf6" }) {
  const w = 140;
  const h = 40;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scaleX = (i) => (values.length === 1 ? w / 2 : (i * (w - pad * 2)) / (values.length - 1) + pad);
  const scaleY = (v) => {
    if (max === min) return h / 2;
    return h - pad - ((v - min) * (h - pad * 2)) / (max - min);
  };

  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i)},${scaleY(v)}`)
    .join("");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-32 h-8" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={scaleX(values.length - 1)} cy={scaleY(values[values.length - 1])} r="3" fill={color} />
    </svg>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  sparkValues,
  sparkColor,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/7 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-9 rounded-xl border border-white/10 bg-white/5">
              <Icon className="size-4 text-indigo-300" />
            </span>
            <div>
              <div className="text-xs text-slate-400 font-semibold">{title}</div>
              <div className="text-2xl font-black text-slate-50 mt-1">{value}</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-bold ${trend >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{trend >= 0 ? "+" : ""}{trend}%</div>
          <div className="text-xs text-slate-400 mt-1">{sub}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <SparklineMini values={sparkValues} color={sparkColor} />
        <div className="text-[11px] text-slate-500">Last 30 days</div>
      </div>
    </div>
  );
}

export default function AIUsageStats({ stats }) {
  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-black text-slate-50">AI Usage Stats</h3>
          <p className="text-sm text-slate-400 mt-1">Engagement across insights, reports, and predictions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          title="Insights Generated"
          value={stats?.insightsGenerated}
          sub="More clarity"
          icon={Zap}
          trend={stats?.insightsTrendPct ?? 8.2}
          sparkValues={stats?.insightsSpark ?? [8, 9, 10, 12, 11, 13, 14, 15]}
          sparkColor="#8b5cf6"
        />
        <StatCard
          title="Reports Created"
          value={stats?.reportsCreated}
          sub="Faster exports"
          icon={FileText}
          trend={stats?.reportsTrendPct ?? 4.6}
          sparkValues={stats?.reportsSpark ?? [3, 4, 4, 6, 5, 7, 8, 8]}
          sparkColor="#22c55e"
        />
        <StatCard
          title="Predictions Used"
          value={stats?.predictionsUsed}
          sub="Forecast confidence"
          icon={Bot}
          trend={stats?.predictionsTrendPct ?? 6.9}
          sparkValues={stats?.predictionsSpark ?? [5, 6, 6, 7, 8, 8, 9, 10]}
          sparkColor="#06b6d4"
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 font-semibold">AI Efficiency</div>
              <div className="text-2xl font-black text-slate-50 mt-1">{stats?.efficiencyScore ?? "92"}%</div>
              <div className="text-xs text-slate-400 mt-2">Automation coverage</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-300">+2.3%</div>
              <div className="text-xs text-slate-400 mt-1">vs last month</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-indigo-400" style={{ width: `${stats?.efficiencyScore ?? 92}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Manual</span>
              <span>Automated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

