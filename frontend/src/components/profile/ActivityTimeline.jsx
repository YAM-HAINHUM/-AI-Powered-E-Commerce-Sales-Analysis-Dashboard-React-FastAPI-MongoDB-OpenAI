import React from "react";
import { Clock, Upload, FileBarChart2, Eye, Database, Sparkles } from "lucide-react";

function TimelineItem({ icon: Icon, title, meta, time, accent = "indigo" }) {
  return (
    <div className="flex gap-4">
      <div className="relative flex items-center justify-center">
        <div className={`size-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center`}>
          <Icon className={`size-4 ${accent === "indigo" ? "text-indigo-300" : "text-emerald-300"}`} />
        </div>
      </div>
      <div className="min-w-0 pb-6 last:pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-200 truncate">{title}</div>
            <div className="text-xs text-slate-400 mt-1">{meta}</div>
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">{time}</div>
        </div>
        <div className="mt-3 h-px bg-white/5" />
      </div>
    </div>
  );
}

export default function ActivityTimeline({ items }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h3 className="text-lg font-black text-slate-50">Activity Timeline</h3>
          <p className="text-sm text-slate-400 mt-1">Recent actions from your workspace.</p>
        </div>
      </div>

      <div className="mt-2">
        {items.map((it, idx) => (
          <TimelineItem
            key={it.id}
            icon={it.icon}
            title={it.title}
            meta={it.meta}
            time={it.time}
            accent={idx % 2 === 0 ? "indigo" : "emerald"}
          />
        ))}
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Clock className="size-3" /> Timeline updates automatically.
        </span>
      </div>
    </section>
  );
}

ActivityTimeline.defaultProps = {
  items: [
    { id: "a1", icon: Upload, title: "Uploaded dataset", meta: "Quarterly orders • 128,432 rows", time: "Today • 09:14" },
    { id: "a2", icon: FileBarChart2, title: "Generated report", meta: "Revenue & margin breakdown", time: "Yesterday • 18:02" },
    { id: "a3", icon: Eye, title: "Viewed insights", meta: "Anomaly: spikes in returns", time: "Yesterday • 12:41" },
  ],
};

