import React from "react";

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  accentClass = "bg-indigo-500",
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${disabled ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          {description ? (
            <span className="text-xs text-slate-400 font-normal truncate">{description}</span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange?.(!checked);
        }}
        className={
          "relative inline-flex h-7 w-12 items-center rounded-full border transition " +
          (checked
            ? "border-indigo-500/30 bg-indigo-500/20"
            : "border-white/10 bg-white/5 hover:bg-white/8")
        }
      >
        <span
          className={
            "inline-flex h-5 w-5 transform items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-sm transition " +
            (checked ? "translate-x-5" : "translate-x-1")
          }
        >
          <span className={`size-2 rounded-full ${checked ? accentClass : "bg-slate-500/70"}`} />
        </span>
      </button>
    </div>
  );
}

