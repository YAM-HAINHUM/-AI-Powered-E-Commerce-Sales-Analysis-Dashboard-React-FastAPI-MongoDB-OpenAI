import React from "react";
import { Target, ShoppingBag, CheckCircle2 } from "lucide-react";

function ProgressRow({ label, current, goal, color = "indigo" }) {
  const pct = Math.round((Number(current) / Math.max(1, Number(goal))) * 100);
  const safePct = Math.max(0, Math.min(100, pct));
  const bar =
    color === "emerald"
      ? "bg-emerald-400"
      : color === "rose"
        ? "bg-rose-400"
        : "bg-indigo-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-200">{label}</div>
        <div className="text-xs text-slate-400">
          {current.toLocaleString()} / {goal.toLocaleString()} ({safePct}%)
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${safePct}%` }} />
      </div>
    </div>
  );
}

export default function GoalsSummary({ revenueGoal, orderGoal }) {
  const completion = (() => {
    const revPct = (revenueGoal.current / Math.max(1, revenueGoal.goal)) * 100;
    const ordPct = (orderGoal.current / Math.max(1, orderGoal.goal)) * 100;
    return Math.round((revPct * 0.55 + ordPct * 0.45));
  })();

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-black text-slate-50">Goals Summary</h3>
          <p className="text-sm text-slate-400 mt-1">Track performance targets across revenue and orders.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <div className="text-xs">
            <div className="font-bold text-emerald-200">{completion}% complete</div>
            <div className="text-[11px] text-slate-300/80">Q3 targets</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-3">
          <ProgressRow label="Revenue goal" current={revenueGoal.current} goal={revenueGoal.goal} color="indigo" />
          <ProgressRow label="Orders goal" current={orderGoal.current} goal={orderGoal.goal} color="emerald" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 font-semibold">Completion</div>
              <div className="text-4xl font-black text-indigo-300 mt-1">{completion}%</div>
            </div>
            <div className="flex items-center justify-center size-12 rounded-2xl border border-white/10 bg-white/5">
              <Target className="size-5 text-indigo-300" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-indigo-400" style={{ width: `${Math.max(0, Math.min(100, completion))}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Projected finish</div>
                <div className="font-bold text-slate-200 mt-1">{completion >= 100 ? "On track" : "Within range"}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Order momentum</div>
                <div className="font-bold text-slate-200 mt-1">{orderGoal.current >= orderGoal.goal * 0.6 ? "Strong" : "Building"}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-400">
            <ShoppingBag className="size-4" /> Updated every 24h from analytics.
          </div>
        </div>
      </div>
    </section>
  );
}

