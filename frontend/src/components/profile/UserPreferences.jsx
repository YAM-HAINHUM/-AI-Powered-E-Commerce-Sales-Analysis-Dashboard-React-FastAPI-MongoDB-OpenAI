import React from "react";
import { LayoutDashboard, Moon, Sun, Puzzle } from "lucide-react";

function PreferenceRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
          <Icon className="size-4 text-indigo-300" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-400 font-semibold">{label}</div>
          <div className="text-sm font-bold text-slate-200 truncate">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function UserPreferences({ prefs }) {
  const themeIcon = prefs?.theme === "dark" ? Moon : Sun;
  const themeLabel = prefs?.theme === "dark" ? "Dark" : "Light";

  const favModule = prefs?.favoriteModule ?? "Revenue Insights";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div>
        <h3 className="text-lg font-black text-slate-50">User Preferences</h3>
        <p className="text-sm text-slate-400 mt-1">Personalize your workspace defaults.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PreferenceRow icon={LayoutDashboard} label="Default dashboard" value={prefs?.defaultDashboard ?? "Executive Overview"} />
        <PreferenceRow icon={themeIcon} label="Theme" value={themeLabel} />
        <PreferenceRow icon={Puzzle} label="Favorite module" value={favModule} />
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-400 font-semibold">Automation</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-200">Auto-generate weekly reports</div>
              <div className="text-xs text-slate-400 mt-1">Runs every Monday 07:00</div>
            </div>
            <div className="w-10 h-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

