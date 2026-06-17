// Enhanced Profile Page with User Tracking Integration
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/components/theme-provider";
import { userTrackingApi } from "@/lib/api";

const Avatar = ({ src, size = 80 }) => (
  <img src={src} alt="avatar" style={{ width: size, height: size }} className="rounded-full object-cover shadow-md border-2 border-white" />
);

const IconSpark = ({ className = "h-6 w-6 text-indigo-600" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364L15.95 8.05M8.05 15.95L4.636 19.364M15.95 15.95l3.414 3.414M4.636 4.636L8.05 8.05"/></svg>
);

const StatsCard = ({ icon, label, value, trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4 hover:shadow-lg transition">
    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">{icon}</div>
    <div className="flex-1">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
    <div className={`text-sm font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
      {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
      <div className="text-xs text-gray-400">{trend.note}</div>
    </div>
  </div>
);

const ProgressBar = ({ label, percent, color = 'bg-indigo-500' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
    <div className="flex justify-between items-center mb-2">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="text-sm font-semibold">{percent}%</div>
    </div>
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div className={`${color} h-3 rounded-full`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);

const TimelineItem = ({ icon, title, time, actionType }) => {
  const actionColors = {
    upload: "text-blue-500",
    login: "text-green-500",
    generate_ai: "text-purple-500",
    view_dashboard: "text-indigo-500",
    default: "text-gray-500"
  };
  const colorClass = actionColors[actionType] || actionColors.default;
  
  return (
    <div className="flex items-start space-x-4">
      <div className={`mt-1 ${colorClass}`}>{icon}</div>
      <div className="flex-1 border-l pl-4">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-gray-400 mt-1">{time}</div>
      </div>
    </div>
  );
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { resolvedTheme, setTheme } = useTheme();

  const [profile, setProfile] = useState({
    name: user?.full_name || "User",
    email: user?.email || "",
    phone: "",
    role: "Analyst",
    organization: "AI Analytics",
    avatar: user?.full_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random` : "",
  });

  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);
  const [activities, setActivities] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiStats, setAiStats] = useState({ total_queries: 0, model_usage: {}, recent: [] });
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [profileRes, actRes, upRes, alertRes, aiRes] = await Promise.all([
        userTrackingApi.getProfile(),
        userTrackingApi.getActivities(20),
        userTrackingApi.getUploads(),
        userTrackingApi.getAlerts("pending"),
        userTrackingApi.getAIUsage(),
      ]);

      const profilePayload = profileRes.data.profile || {};
      const personalInfo = profilePayload.personal_info || {};
      const accountSettings = profilePayload.account_settings || {};

      const avatarUrl = personalInfo.profile_picture || profile.avatar;
      setProfile((current) => ({
        ...current,
        name: personalInfo.full_name || current.name,
        email: personalInfo.email || current.email,
        phone: personalInfo.phone || current.phone,
        role: personalInfo.role ? personalInfo.role.charAt(0).toUpperCase() + personalInfo.role.slice(1) : current.role,
        organization: personalInfo.organization || current.organization,
        avatar: avatarUrl,
      }));

      setAvatarPreview(avatarUrl);

      if (accountSettings.theme) {
        setTheme(accountSettings.theme);
      }

      setActivities(actRes.data.activities || []);
      setUploads(upRes.data.uploads || []);
      setAlerts(alertRes.data.alerts || []);
      setAiStats(aiRes.data || { total_queries: 0, model_usage: {}, recent: [] });
    } catch (e) {
      console.error("Failed to load user data:", e);
      setErrorMessage("Unable to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { id: 1, label: 'Insights Generated', value: aiStats.total_queries || 0, trend: { value: 12, note: 'vs last month' } },
    { id: 2, label: 'Reports Created', value: activities.filter(a => a.action === 'export_report').length, trend: { value: 8, note: 'vs last month' } },
    { id: 3, label: 'Predictions Used', value: activities.filter(a => a.action === 'generate_ai').length, trend: { value: -3, note: 'vs last month' } },
    { id: 4, label: 'Active Alerts', value: alerts.length, trend: { value: 22, note: 'total pending' } },
  ];
  const handleThemeToggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const handleExportReport = async (format = "json") => {
    try {
      const res = await userTrackingApi.exportReport(format);
      const content = format === "csv" ? res.data : JSON.stringify(res.data, null, 2);
      const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activity-report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSaveMessage("Activity report downloaded.");
    } catch (err) {
      console.error("Export failed", err);
      setErrorMessage("Export failed. Please try again.");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveMessage(null);
    setLoading(true);
    try {
      await userTrackingApi.updateProfile(
        {
          full_name: profile.name,
          email: profile.email,
          phone: profile.phone,
          profile_picture: profile.avatar,
          role: profile.role.toLowerCase(),
          organization: profile.organization,
        },
        {
          theme: resolvedTheme,
        }
      );

      setEditing(false);
      setSaveMessage("Profile saved successfully.");
      await loadUserData();
    } catch (err) {
      console.error("Save failed", err);
      setErrorMessage("Unable to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsNavigation = () => {
    navigate("/app/settings");
  };
  const goals = [
    { id: 'r', label: 'Revenue Goal', percent: 75 },
    { id: 'o', label: 'Orders Goal', percent: 60 },
  ];

  function handleAvatarChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatarPreview(url);
    setProfile((u) => ({ ...u, avatar: url }));
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar src={avatarPreview} size={96} />
            <label className="absolute -bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md cursor-pointer hover:bg-indigo-50">
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </label>
          </div>
        </div>

        <div className="flex-1 w-full">
<div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-semibold">{profile.name}</h2>
                  <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">{profile.role}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{profile.email}</div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => setEditing((s) => !s)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">{editing ? 'Cancel' : 'Edit Profile'}</button>
              </div>
            </div>
            {saveMessage ? (
              <div className="mt-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-200">{saveMessage}</div>
            ) : null}
            {errorMessage ? (
              <div className="mt-3 rounded-md bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-200">{errorMessage}</div>
            ) : null}
            {editing ? (
              <form onSubmit={handleSaveProfile} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="p-2 rounded border" value={profile.name} onChange={(e) => setProfile((u) => ({ ...u, name: e.target.value }))} placeholder="Full Name" />
                <input className="p-2 rounded border" value={profile.email} onChange={(e) => setProfile((u) => ({ ...u, email: e.target.value }))} placeholder="Email" />
                <input className="p-2 rounded border" value={profile.phone} onChange={(e) => setProfile((u) => ({ ...u, phone: e.target.value }))} placeholder="Phone" />
                <input className="p-2 rounded border" value={profile.organization} onChange={(e) => setProfile((u) => ({ ...u, organization: e.target.value }))} placeholder="Organization" />
                <div className="md:col-span-2 flex justify-end space-x-2">
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">Member since: <div className="font-medium">Jan 2024</div></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">Company: <div className="font-medium">AI Analytics</div></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">Location: <div className="font-medium">San Francisco, CA</div></div>
              </div>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatsCard key={s.id} icon={<IconSpark />} label={s.label} value={s.value} trend={s.trend} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-lg font-semibold mb-3">Your Activity Insights</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded">
            <div className="text-2xl font-bold text-indigo-600">{aiStats.total_queries}</div>
            <div className="text-sm text-gray-600">AI Queries This Month</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-2xl font-bold text-green-600">{uploads.length}</div>
            <div className="text-sm text-gray-600">Files Uploaded</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div className="text-2xl font-bold text-yellow-600">{alerts.length}</div>
            <div className="text-sm text-gray-600">Active Alerts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">Recent Activity</div>
            <div className="text-sm text-gray-400">Showing latest {activities.length}</div>
          </div>
          <div className="space-y-4">
            {activities.map((t) => (
              <TimelineItem 
                key={t._id} 
                icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"/></svg>} 
                title={`${t.action.replace('_', ' ')} - ${t.module}`} 
                time={timeAgo(new Date(t.timestamp))}
                actionType={t.action}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-lg font-semibold mb-3">Goals</div>
            <div className="space-y-3">{goals.map((g) => (<ProgressBar key={g.id} label={g.label} percent={g.percent} />))}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-lg font-semibold mb-3">User Preferences</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><div className="text-sm text-gray-600">Default Dashboard</div><div className="text-sm font-medium">Overview</div></div>
              <div className="flex justify-between items-center"><div className="text-sm text-gray-600">Theme</div><div className="flex items-center space-x-2"><div className="text-sm font-medium">{resolvedTheme === "dark" ? "Dark" : "Light"}</div><button onClick={handleThemeToggle} className="px-2 py-1 bg-gray-100 rounded">Toggle</button></div></div>
              <div className="flex justify-between items-center"><div className="text-sm text-gray-600">Favorite Module</div><div className="text-sm font-medium">Trends</div></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-lg font-semibold mb-3">Uploaded Files</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploads.map((u) => (
                <div key={u._id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{u.file_name}</div>
                    <div className="text-xs text-gray-500">{u.rows_count} rows • {Math.round(u.file_size / 1024)} KB</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">{u.file_type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-lg font-semibold mb-3">AI Usage Stats</div>
            <div className="space-y-2">
              {aiStats.recent.map((r, i) => (
                <div key={i} className="text-sm">
                  <div className="font-medium truncate">{r.query}</div>
                  <div className="text-xs text-gray-500">{r.model_used} • {new Date(r.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-lg font-semibold mb-3">Security</div>
            <div className="text-sm text-gray-600">Last login</div>
            <div className="font-medium">{new Date().toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-2">Device</div>
            <div className="font-medium">-</div>
            <div className="text-sm text-gray-600 mt-2">Password</div>
            <div className="font-medium">Updated 3 days ago</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <div className="text-sm text-gray-500">Account ID: <span className="font-medium">usr-{user?.id?.slice(0, 8) || 'demo'}</span></div>
        <div className="flex items-center space-x-3">
          <button onClick={() => handleExportReport('json')} className="text-sm px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded hover:shadow">Export Activity Report</button>
          <button onClick={handleSettingsNavigation} className="text-sm px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded hover:shadow">Settings</button>
        </div>
      </div>
    </div>
  );
}