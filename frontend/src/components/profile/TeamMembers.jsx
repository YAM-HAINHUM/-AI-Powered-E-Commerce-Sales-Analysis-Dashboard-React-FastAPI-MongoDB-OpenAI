import React from "react";
import { Shield, Crown, UserPlus } from "lucide-react";

function RoleBadge({ role }) {
  const cls = role === "Admin" ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-200" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold border ${cls}`}>
      {role}
    </span>
  );
}

export default function TeamMembers({ members, onInvite }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-50">Team Members</h3>
          <p className="text-sm text-slate-400 mt-1">Collaboration for dashboards & insights.</p>
        </div>

        <button
          onClick={onInvite}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
        >
          <UserPlus className="size-4" />
          Invite
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-cyan-400/15 border border-white/10 flex items-center justify-center font-black text-indigo-200">
                {m.name.split(" ").map((p) => p[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-200 truncate">{m.name}</div>
                <div className="text-xs text-slate-400 truncate">{m.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={m.role} />
              {m.role === "Admin" ? <Shield className="size-4 text-indigo-300" /> : <Crown className="size-4 text-emerald-300" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

