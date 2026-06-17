import React, { useMemo, useState } from "react";
import { Upload, Pencil, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

function initials(name = "User") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

export default function ProfileHeader({ user, onEdit }) {
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarLetters = useMemo(() => initials(user?.name), [user?.name]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-indigo-500/25 via-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-indigo-200">{avatarLetters}</span>
              )}
            </div>

            <label className="absolute -bottom-2 -right-2 size-10 rounded-xl border border-white/10 bg-background/70 hover:bg-background transition flex items-center justify-center cursor-pointer">
              <Upload className="size-4 text-indigo-300" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setAvatarPreview(reader.result);
                  reader.readAsDataURL(f);
                }}
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-black text-slate-50">
                {user?.name}
              </h2>
              {user?.role ? (
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-emerald-200">
                  <ShieldCheck className="size-3" />
                  {user.role}
                </span>
              ) : null}

              {user?.plan ? (
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-500/20 bg-indigo-500/10 text-indigo-200">
                  <Sparkles className="size-3" />
                  {user.plan}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 text-sm">
              <div className="text-slate-400">{user?.email}</div>
              <div className="hidden sm:block">•</div>
              <div className="text-slate-400">Member since {user?.memberSince}</div>
            </div>
          </div>
        </div>

        <div className="lg:ml-auto flex items-center gap-3">
          <button
            onClick={() => onEdit?.()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
          >
            <Pencil className="size-4" />
            Edit profile
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 className="size-4 text-emerald-300" />
            <div className="text-xs">
              <div className="font-bold text-emerald-200">Verified workspace</div>
              <div className="text-[11px] text-slate-300/80">SAML-ready + audit logs</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

