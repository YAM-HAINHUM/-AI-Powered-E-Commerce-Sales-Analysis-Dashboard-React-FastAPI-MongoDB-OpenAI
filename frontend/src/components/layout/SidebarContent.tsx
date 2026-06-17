import React, { useMemo } from "react"
import { NavLink } from "react-router-dom"
import { BarChart3, LayoutDashboard, TrendingUp, Code2, Brain, Users, LogOut, Layout, Database, Activity, FileDown, AlertTriangle, Lightbulb, UserX, Star, DollarSign, FileText, Bell } from "lucide-react"


import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from "@/store/authStore"

// ── Navigation config ─────────────────────────────────────────────────────────
interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  badge?: string
}

interface NavSection {
  section: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    section: "Overview",
    items: [
      { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/app/analytics", icon: TrendingUp, label: "Analytics" },
      { to: "/app/live-data", icon: Activity, label: "Live Data", badge: "LIVE" },
    ],
  },
  {
    section: "Predictive AI",
    items: [
      { to: "/app/ai-insights", icon: Brain, label: "AI Insights" },
      { to: "/app/forecast", icon: TrendingUp, label: "Forecasting" },
      { to: "/app/anomalies", icon: AlertTriangle, label: "Anomaly Detection" },
      { to: "/app/recommendations", icon: Lightbulb, label: "Recommendations" },
      { to: "/app/segments", icon: Users, label: "Customer Segments" },
      { to: "/app/churn", icon: UserX, label: "Churn Prediction" },
      { to: "/app/product-score", icon: Star, label: "Product Score" },
      { to: "/app/pricing", icon: DollarSign, label: "Pricing AI" },
      { to: "/app/ai-reports", icon: FileText, label: "AI Reports" },
      { to: "/app/data-intelligence", icon: Database, label: "Data Intelligence" },
    ],
  },
  {
    section: "Core Engine",
    items: [
      { to: "/app/sql", icon: Code2, label: "SQL Engine" },
      { to: "/app/dashboard-builder", icon: Layout, label: "Layout Builder" },
      { to: "/app/upload", icon: Database, label: "Data Upload" },
    ],
  },
  {
    section: "AI SaaS",
    items: [
      { to: "/app/health", icon: BarChart3, label: "Business Health" },
      { to: "/app/goals", icon: TrendingUp, label: "Goals" },
      { to: "/app/alerts", icon: Bell, label: "Alerts" },
      { to: "/app/trends", icon: Layout, label: "Trends" },
      { to: "/app/compare", icon: Code2, label: "Compare" },
    ],
  },
  {
    section: "Management",
    items: [
      { to: "/app/profile", icon: UserX, label: "Profile" },
      { to: "/app/settings", icon: Code2, label: "Settings" },
      { to: "/app/customers", icon: Users, label: "Customers" },
      { to: "/app/reports", icon: FileDown, label: "Reports" },
    ],
  },
]


export interface SidebarContentProps {
  isCollapsed: boolean
}

function SidebarContentInner({ isCollapsed }: SidebarContentProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { user, logout } = useAuthStore()

  const onLogout = () => {
    logout()
    // navigation is handled by AppLayout (outside this component)
  }

  const navSections = useMemo(() => NAV_SECTIONS, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div
        className={`flex items-center gap-2.5 px-4 py-5 border-b shrink-0 overflow-hidden transition-all duration-200 ${
          isDark ? "border-white/[0.06]" : "border-slate-200"
        }`}
      >
        <div
          className="size-8 rounded-xl gradient-primary flex items-center justify-center shrink-0"
          style={{ boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}
        >
          <BarChart3 className="size-4 text-white" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-sm transition-all duration-200 whitespace-nowrap">
            DataInsight <span className="gradient-text-static">AI</span>
          </span>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-hidden">
        {navSections.map(({ section, items }, si) => (
          <div key={section} className={si > 0 ? "mt-4" : ""}>
            {/* Section header */}
            {section && !isCollapsed && (
              <div className="px-3 mb-1.5 mt-0.5 whitespace-nowrap overflow-hidden">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest transition-opacity duration-200 ${
                    isDark ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {section}
                </span>
              </div>
            )}
            {section && isCollapsed && (
              <div className="h-px bg-white/[0.06] dark:bg-white/[0.06] my-2 mx-1 shrink-0" />
            )}

            {/* Items */}
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-500/15 text-indigo-300 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]"
                        : isDark
                          ? "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-indigo-500/10"
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <Icon className={`size-4 shrink-0 relative z-10 ${isActive ? "text-indigo-400" : ""}`} />
                      {!isCollapsed && (
                        <span className="relative z-10 flex-1 truncate whitespace-nowrap">{label}</span>
                      )}
                      {!isCollapsed && badge && (
                        <span className="relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 tracking-wide shrink-0">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div
        className={`px-3 py-4 border-t ${isDark ? "border-white/[0.06]" : "border-slate-200"} space-y-0.5 shrink-0 overflow-hidden`}
      >
        <div className="px-0.5">
          <ThemeToggle variant={isCollapsed ? "icon" : "full"} showSystem={!isCollapsed} className="w-full" />
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full cursor-pointer overflow-hidden"
        >
          <LogOut className="size-4 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
        {user && (
          <div
            className={`flex items-center gap-3 px-3 py-3 mt-1 border-t ${
              isDark ? "border-white/[0.05]" : "border-slate-200"
            } overflow-hidden`}
          >
            <div
              className="size-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ boxShadow: "0 0 12px rgba(99,102,241,0.3)" }}
            >
              {user.full_name?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {user.full_name || user.username}
                </div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const SidebarContent = React.memo(SidebarContentInner)

