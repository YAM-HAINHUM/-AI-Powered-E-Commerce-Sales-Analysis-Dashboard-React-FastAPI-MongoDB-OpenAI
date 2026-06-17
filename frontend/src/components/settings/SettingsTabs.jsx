import React from "react";

export default function SettingsTabs({ tabs, activeKey, onChange }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-2">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.key === activeKey;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={
                "px-3 py-2 rounded-xl text-sm font-semibold transition border " +
                (active
                  ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-200"
                  : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5")
              }
            >
              <span className="inline-flex items-center gap-2">
                {t.icon ? <span className="text-slate-200">{t.icon}</span> : null}
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

