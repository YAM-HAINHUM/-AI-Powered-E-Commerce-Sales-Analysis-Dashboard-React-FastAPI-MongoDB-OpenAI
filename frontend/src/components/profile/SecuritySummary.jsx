import React, { useMemo, useState } from "react";
import { ShieldCheck, KeyRound, RotateCcw, Smartphone, LogOut, EyeOff, AlertTriangle } from "lucide-react";

export default function SecuritySummary({ security, onChangePassword, onLogoutDevices }) {
  const [confirming, setConfirming] = useState(false);

  const passwordStatusTone = useMemo(() => {
    const s = security?.passwordStatus?.toLowerCase?.() ?? "secure";
    if (s.includes("expired") || s.includes("weak")) return "text-rose-300";
    return "text-emerald-300";
  }, [security?.passwordStatus]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div>
        <h3 className="text-lg font-black text-slate-50">Security Info</h3>
        <p className="text-sm text-slate-400 mt-1">Protect your account with strong auth.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 font-semibold">Last login</div>
              <div className="text-sm font-bold text-slate-200 mt-1">{security?.lastLogin ?? "—"}</div>
            </div>
            <ShieldCheck className="size-4 text-indigo-300" />
          </div>
          <div className="mt-2 text-xs text-slate-500">IP: {security?.lastLoginIp ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 font-semibold">Active device</div>
              <div className="text-sm font-bold text-slate-200 mt-1">{security?.activeDevice ?? "—"}</div>
            </div>
            <Smartphone className="size-4 text-emerald-300" />
          </div>
          <div className="mt-2 text-xs text-slate-500">Session: {security?.activeSession ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold">Password status</div>
              <div className={`text-sm font-bold mt-1 ${passwordStatusTone}`}>{security?.passwordStatus ?? "Secure"}</div>
              <div className="text-xs text-slate-500 mt-1">We recommend rotating every 90 days.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangePassword?.()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
              >
                <KeyRound className="size-4" />
                Change password
              </button>
              <button
                onClick={() => {
                  if (!confirming) {
                    setConfirming(true);
                    setTimeout(() => setConfirming(false), 4000);
                    return;
                  }
                  onLogoutDevices?.();
                  setConfirming(false);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 transition text-sm font-bold text-rose-200"
              >
                {confirming ? <EyeOff className="size-4" /> : <RotateCcw className="size-4" />}
                {confirming ? "Confirm logout" : "Logout all devices"}
              </button>
            </div>
          </div>
          {(security?.riskFlag ?? false) ? (
            <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 flex items-start gap-3">
              <AlertTriangle className="size-5 text-rose-300 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-rose-200">Security attention required</div>
                <div className="text-xs text-slate-300/90 mt-1">We detected an unusual login attempt. Review device activity.</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

