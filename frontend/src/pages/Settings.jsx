import React, { useEffect, useMemo, useState } from "react";
import { Settings2, Bell, Wand2, Palette, Database, Shield, Puzzle, PlugZap, RotateCcw, LogOut, KeyRound } from "lucide-react";

import SettingsTabs from "@/components/settings/SettingsTabs";
import ToggleSwitch from "@/components/settings/ToggleSwitch";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/authStore";
import { userTrackingApi } from "@/lib/api";

export default function Settings() {
  const tabs = useMemo(
    () => [
      { key: "ai", label: "AI Settings", icon: <Wand2 className="size-4" /> },
      { key: "notifications", label: "Notifications", icon: <Bell className="size-4" /> },
      { key: "appearance", label: "Appearance", icon: <Palette className="size-4" /> },
      { key: "data", label: "Data Settings", icon: <Database className="size-4" /> },
      { key: "security", label: "Security", icon: <Shield className="size-4" /> },
      { key: "integrations", label: "Integrations", icon: <PlugZap className="size-4" /> },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState("ai");

  // AI Settings (mock interactive state)
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
  const [forecastEnabled, setForecastEnabled] = useState(true);
  const [insightFrequency, setInsightFrequency] = useState("Weekly");

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [types, setTypes] = useState({
    revenueDrop: true,
    goalAchieved: true,
    anomalyDetection: true,
  });

  // Appearance
  const [themeMode, setThemeMode] = useState("dark");
  const [accentColor, setAccentColor] = useState("indigo");
  const [density, setDensity] = useState("Comfortable");

  // Data Settings
  const [currency, setCurrency] = useState("₹");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [refreshRate, setRefreshRate] = useState("15 min");

  const [saveMessage, setSaveMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [savedTick, setSavedTick] = useState(0);

  const accentOptions = useMemo(
    () => [
      { key: "indigo", label: "Indigo", swatch: "from-indigo-500" },
      { key: "violet", label: "Violet", swatch: "from-violet-500" },
      { key: "cyan", label: "Cyan", swatch: "from-cyan-400" },
      { key: "emerald", label: "Emerald", swatch: "from-emerald-400" },
      { key: "rose", label: "Rose", swatch: "from-rose-400" },
    ],
    []
  );

  const { logout } = useAuthStore();
  const { setTheme } = useTheme();

  const showSaved = (message = "Changes saved") => {
    setSavedTick((n) => n + 1);
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleSaveSettings = async () => {
    setErrorMessage(null);
    try {
      await userTrackingApi.updateProfile(
        undefined,
        {
          theme: themeMode,
          accentColor,
          density,
          currency,
          timezone,
          refreshRate,
          emailAlerts,
          inAppAlerts,
          revenueDrop: types.revenueDrop,
          goalAchieved: types.goalAchieved,
          anomalyDetection: types.anomalyDetection,
          aiInsightsEnabled,
          forecastEnabled,
          insightFrequency,
        }
      );

      setTheme(themeMode);
      showSaved("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to save settings. Please try again.");
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await userTrackingApi.getProfile();
        const settings = (res.data.profile || {}).account_settings || {};

        if (settings.theme) {
          setThemeMode(settings.theme);
          setTheme(settings.theme);
        }
        if (settings.accentColor) setAccentColor(settings.accentColor);
        if (settings.density) setDensity(settings.density);
        if (settings.currency) setCurrency(settings.currency);
        if (settings.timezone) setTimezone(settings.timezone);
        if (settings.refreshRate) setRefreshRate(settings.refreshRate);
        if (settings.emailAlerts !== undefined) setEmailAlerts(settings.emailAlerts);
        if (settings.inAppAlerts !== undefined) setInAppAlerts(settings.inAppAlerts);
        if (settings.revenueDrop !== undefined || settings.goalAchieved !== undefined || settings.anomalyDetection !== undefined) {
          setTypes({
            revenueDrop: settings.revenueDrop ?? true,
            goalAchieved: settings.goalAchieved ?? true,
            anomalyDetection: settings.anomalyDetection ?? true,
          });
        }
        if (settings.aiInsightsEnabled !== undefined) setAiInsightsEnabled(settings.aiInsightsEnabled);
        if (settings.forecastEnabled !== undefined) setForecastEnabled(settings.forecastEnabled);
        if (settings.insightFrequency) setInsightFrequency(settings.insightFrequency);
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    loadSettings();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">Control AI behavior, notifications, appearance, data, security, and integrations.</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Settings2 className="size-4" /> Central control
            </span>
          </span>
        </div>
      </div>

      <SettingsTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {saveMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {saveMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      {/* Content */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
        {/* AI SETTINGS */}
        {activeTab === "ai" ? (
          <div className="space-y-5">
            <div>
              <div className="text-lg font-black text-slate-50">AI Settings</div>
              <div className="text-sm text-slate-400 mt-1">Tune insight generation and enable forecasting pipelines.</div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ToggleSwitch
                  checked={aiInsightsEnabled}
                  onChange={setAiInsightsEnabled}
                  label="Enable AI insights"
                  description="Auto-detect opportunities"
                  accentClass="bg-indigo-400"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ToggleSwitch
                  checked={forecastEnabled}
                  onChange={setForecastEnabled}
                  label="Enable forecasting"
                  description="Model revenue & order trajectories"
                  accentClass="bg-cyan-400"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-200">Insight frequency</div>
                    <div className="text-xs text-slate-400 mt-1">Determines how often AI summaries are computed.</div>
                  </div>
                  <div className="w-56">
                    <select
                      value={insightFrequency}
                      onChange={(e) => setInsightFrequency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-background/10 text-slate-100 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-slate-400 font-semibold">Current run mode</div>
                    <div className="text-sm font-bold text-slate-200 mt-1">
                      {aiInsightsEnabled ? "Insights enabled" : "Insights disabled"} • {insightFrequency}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-slate-400 font-semibold">Forecast pipeline</div>
                    <div className="text-sm font-bold text-slate-200 mt-1">
                      {forecastEnabled ? "Running" : "Paused"} • Scenario drift monitored
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
                onClick={() => {
                  setAiInsightsEnabled(true);
                  setForecastEnabled(true);
                  setInsightFrequency("Weekly");
                  showSaved();
                }}
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                onClick={handleSaveSettings}
              >
                <Puzzle className="size-4" />
                Save AI settings
              </button>
            </div>
          </div>
        ) : null}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" ? (
          <div className="space-y-5">
            <div>
              <div className="text-lg font-black text-slate-50">Notifications</div>
              <div className="text-sm text-slate-400 mt-1">Control where alerts are delivered and which alert types trigger.</div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ToggleSwitch checked={emailAlerts} onChange={setEmailAlerts} label="Email alerts" description="Operational insights" accentClass="bg-emerald-400" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ToggleSwitch checked={inAppAlerts} onChange={setInAppAlerts} label="In-app alerts" description="Real-time notifications" accentClass="bg-indigo-400" />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-slate-200">Alert types</div>
                <div className="text-xs text-slate-400 mt-1">Choose the signals your team wants to act on.</div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(
                    [
                      { key: "revenueDrop", title: "Revenue drop", icon: <span className="text-rose-300">↓</span> },
                      { key: "goalAchieved", title: "Goal achieved", icon: <span className="text-emerald-300">✓</span> },
                      { key: "anomalyDetection", title: "Anomaly detection", icon: <span className="text-indigo-300">!</span> },
                    ]
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTypes((p) => ({ ...p, [t.key]: !p[t.key] }))}
                      className={
                        "rounded-xl border p-3 text-left transition " +
                        (types[t.key]
                          ? "border-indigo-500/30 bg-indigo-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/8")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            {t.icon}
                            {t.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {t.key === "revenueDrop" ? "Weekly comparison" : t.key === "goalAchieved" ? "Milestone completion" : "Outlier clusters"}
                          </div>
                        </div>
                        <div className={"size-8 rounded-xl border flex items-center justify-center " + (types[t.key] ? "border-indigo-500/30 bg-indigo-500/15" : "border-white/10 bg-white/5")}>
                          <span className={types[t.key] ? "text-indigo-200 font-black" : "text-slate-500"}>{types[t.key] ? "ON" : "OFF"}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
                onClick={() => {
                  setEmailAlerts(true);
                  setInAppAlerts(true);
                  setTypes({ revenueDrop: true, goalAchieved: true, anomalyDetection: true });
                  showSaved();
                }}
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                onClick={showSaved}
              >
                <Puzzle className="size-4" />
                Save notification rules
              </button>
            </div>
          </div>
        ) : null}

        {/* APPEARANCE */}
        {activeTab === "appearance" ? (
          <div className="space-y-5">
            <div>
              <div className="text-lg font-black text-slate-50">Appearance</div>
              <div className="text-sm text-slate-400 mt-1">Theme, accent color, and density for comfortable browsing.</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-slate-200">Theme</div>
                <div className="text-xs text-slate-400 mt-1">Switch between dark and light UI.</div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  {[
                    { key: "dark", label: "Dark" },
                    { key: "light", label: "Light" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setThemeMode(t.key)}
                      className={
                        "px-3 py-2 rounded-xl border text-sm font-bold transition " +
                        (themeMode === t.key
                          ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                          : "border-white/10 bg-white/5 hover:bg-white/8 text-slate-300")
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-400 font-semibold">Preview</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-200">SaaS cards</div>
                      <div className="text-xs text-slate-500 mt-1">Glass + gradient accents</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <span className="text-2xl">{themeMode === "dark" ? "🌙" : "☀️"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-slate-200">Accent color</div>
                <div className="text-xs text-slate-400 mt-1">Used for charts and primary CTAs.</div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {accentOptions.map((o) => {
                    const active = accentColor === o.key;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => setAccentColor(o.key)}
                        className={
                          "rounded-xl border p-3 flex items-center gap-3 transition " +
                          (active
                            ? "border-indigo-500/30 bg-indigo-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/8")
                        }
                      >
                        <span className={`size-8 rounded-xl bg-gradient-to-br ${o.swatch} via-fuchsia-500/20 to-sky-400/20 border border-white/10`} />
                        <span className="text-xs font-black text-slate-200">{o.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <div className="text-xs text-slate-400 font-semibold">Layout density</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {["Comfortable", "Compact", "Cozy"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDensity(d)}
                        className={
                          "px-3 py-2 rounded-xl border text-sm font-bold transition " +
                          (density === d
                            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                            : "border-white/10 bg-white/5 hover:bg-white/8 text-slate-300")
                        }
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
                onClick={() => {
                  setThemeMode("dark");
                  setAccentColor("indigo");
                  setDensity("Comfortable");
                  showSaved();
                }}
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                onClick={handleSaveSettings}
              >
                <Palette className="size-4" />
                Save appearance
              </button>
            </div>
          </div>
        ) : null}

        {/* DATA SETTINGS */}
        {activeTab === "data" ? (
          <div className="space-y-5">
            <div>
              <div className="text-lg font-black text-slate-50">Data Settings</div>
              <div className="text-sm text-slate-400 mt-1">Currency, timezone, and how frequently your analytics refresh.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-slate-200">Currency</div>
                <div className="text-xs text-slate-400 mt-1">How revenue is displayed.</div>
                <div className="mt-4">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-background/10 text-slate-100 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="₹">₹ INR</option>
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                    <option value="¥">¥ JPY</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-slate-200">Timezone</div>
                <div className="text-xs text-slate-400 mt-1">Affects charts and scheduling.</div>
                <div className="mt-4">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-background/10 text-slate-100 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-slate-200">Refresh rate</div>
                <div className="text-xs text-slate-400 mt-1">How often analytics pull new data.</div>
                <div className="mt-4">
                  <select
                    value={refreshRate}
                    onChange={(e) => setRefreshRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-background/10 text-slate-100 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="5 min">5 min</option>
                    <option value="15 min">15 min</option>
                    <option value="1 hour">1 hour</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-200">Data preview</div>
                  <div className="text-xs text-slate-400 mt-1">Mock impact of your settings on chart formatting.</div>
                </div>
                <div className="text-xs text-slate-400">Updated just now</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {["Gross revenue", "Net revenue", "Orders"].map((label, i) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-slate-400 font-semibold">{label}</div>
                    <div className="text-2xl font-black text-slate-50 mt-2">
                      {currency}
                      {i === 0 ? "12.8" : i === 1 ? "9.6" : "7,420"}
                      {i < 2 ? "M" : ""}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Timezone: {timezone}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
                onClick={() => {
                  setCurrency("₹");
                  setTimezone("Asia/Kolkata");
                  setRefreshRate("15 min");
                  showSaved();
                }}
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                onClick={handleSaveSettings}
              >
                <Database className="size-4" />
                Save data settings
              </button>
            </div>
          </div>
        ) : null}

        {/* SECURITY */}
        {activeTab === "security" ? (
          <div className="space-y-5">
            <div>
              <div className="text-lg font-black text-slate-50">Security</div>
              <div className="text-sm text-slate-400 mt-1">Password management and session controls.</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-200">Change password</div>
                    <div className="text-xs text-slate-400 mt-1">Keep your account secure with periodic rotations.</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                    <KeyRound className="size-5 text-indigo-300" />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                    onClick={showSaved}
                  >
                    <KeyRound className="size-4" />
                    Open password flow
                  </button>
                </div>
                <div className="mt-3 text-xs text-slate-500">Mock flow: validates strength meter and updates credentials.</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-200">Logout all devices</div>
                    <div className="text-xs text-slate-400 mt-1">Terminate active sessions across browsers.</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                    <LogOut className="size-5 text-rose-300" />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 transition text-sm font-bold text-rose-200"
                    onClick={() => {
                      logout();
                      showSaved("Logged out from all devices.");
                    }}
                  >
                    <LogOut className="size-4" />
                    Logout all devices
                  </button>
                </div>
                <div className="mt-3 text-xs text-slate-500">Mock action: marks sessions revoked and refreshes auth state.</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-bold text-slate-200">Security posture</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[{ k: "2FA", v: "Enabled", c: "emerald" }, { k: "Audit logs", v: "On", c: "indigo" }, { k: "Session age", v: "7 days", c: "cyan" }].map((x) => (
                  <div key={x.k} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-slate-400 font-semibold">{x.k}</div>
                    <div className={`text-sm font-bold mt-1 ${x.c === "emerald" ? "text-emerald-200" : x.c === "cyan" ? "text-cyan-200" : "text-indigo-200"}`}>{x.v}</div>
                    <div className="text-xs text-slate-500 mt-1">Last checked: just now</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
                onClick={showSaved}
              >
                <RotateCcw className="size-4" />
                Re-check status
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                onClick={handleSaveSettings}
              >
                <Shield className="size-4" />
                Save security settings
              </button>
            </div>
          </div>
        ) : null}

        {/* INTEGRATIONS */}
        {activeTab === "integrations" ? (
          <div className="space-y-5">
            <div>
              <div className="text-lg font-black text-slate-50">Integrations</div>
              <div className="text-sm text-slate-400 mt-1">Connect third-party sources for richer analytics.</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-200">Shopify</div>
                    <div className="text-xs text-slate-400 mt-1">Sync orders, refunds, and product catalog.</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                    <span className="text-lg">🛍️</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
                    onClick={showSaved}
                  >
                    <PlugZap className="size-4" />
                    Connect (mock)
                  </button>
                  <button
                    className="size-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    onClick={showSaved}
                    aria-label="Disconnect"
                    title="Disconnect"
                  >
                    <RotateCcw className="size-4 text-slate-200 mx-auto" />
                  </button>
                </div>

                <div className="mt-3 text-xs text-slate-500">Best results: enable webhooks + scheduled sync.</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-200">Google Analytics</div>
                    <div className="text-xs text-slate-400 mt-1">Bring traffic sources and conversion funnels.</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                    <span className="text-lg">📈</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                    onClick={showSaved}
                  >
                    <PlugZap className="size-4" />
                    Connect (mock)
                  </button>
                  <button
                    className="size-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    onClick={showSaved}
                    aria-label="Disconnect"
                    title="Disconnect"
                  >
                    <RotateCcw className="size-4 text-slate-200 mx-auto" />
                  </button>
                </div>

                <div className="mt-3 text-xs text-slate-500">We map sessions to conversion events for attribution.</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-200">Integration health</div>
                  <div className="text-xs text-slate-400 mt-1">Monitoring status based on mock data.</div>
                </div>
                <div className="text-xs text-slate-400">Last scan: now</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[{ name: "Shopify", status: "Connected", color: "emerald" }, { name: "GA4", status: "Ready", color: "indigo" }, { name: "Webhooks", status: "Active", color: "cyan" }].map((x) => (
                  <div key={x.name} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-slate-400 font-semibold">{x.name}</div>
                    <div className={`mt-1 text-sm font-bold ${x.color === "emerald" ? "text-emerald-200" : x.color === "cyan" ? "text-cyan-200" : "text-indigo-200"}`}>{x.status}</div>
                    <div className="text-xs text-slate-500 mt-1">Sync interval: {refreshRate}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-slate-200"
                onClick={showSaved}
              >
                <RotateCcw className="size-4" />
                Refresh health
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition text-sm font-bold text-indigo-200"
                onClick={handleSaveSettings}
              >
                <Puzzle className="size-4" />
                Save integration preferences
              </button>
            </div>
          </div>
        ) : null}

        {savedTick > 0 ? (
          <div key={savedTick} className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-sm font-bold text-emerald-200">Changes saved</div>
            <div className="text-xs text-slate-300/90 mt-1">Mock state persisted in-memory for this session.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

