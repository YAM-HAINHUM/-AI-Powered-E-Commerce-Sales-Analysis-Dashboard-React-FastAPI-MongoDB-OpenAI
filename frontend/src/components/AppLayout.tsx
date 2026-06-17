import { useState, useEffect, useCallback } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Menu, BarChart3, Bell } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from "@/store/authStore"
import { motion, AnimatePresence } from "framer-motion"
import { SidebarContent } from "@/components/layout/SidebarContent"

export default function AppLayout() {

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  // Sidebar hover state (for desktop)
  const [isHovered, setIsHovered] = useState(false)
  // Mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [notifications, setNotifications] = useState<{
    id: string; customer: string; product: string; amount: number; timestamp: string
  }[]>([])

  // WebSocket for Real-time Notifications
  useEffect(() => {
    const apiVal = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
    const wsUrl = apiVal.replace(/^http/, "ws") + "/api/realtime"

    let ws: WebSocket
    const connect = () => {
      ws = new WebSocket(wsUrl)
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "new_order") {
            const newNotif = { id: `${Date.now()}-${Math.random()}`, ...data }
            setNotifications((prev) => [newNotif, ...prev])
            setTimeout(() => {
              setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id))
            }, 5000)
          }
        } catch (e) {
          console.error("Failed parsing websocket message:", e)
        }
      }
      ws.onclose = () => setTimeout(connect, 3000)
    }
    connect()
    return () => {
      if (ws) ws.close()
    }
  }, [])

  // logout handled inside SidebarContent


  // Ensure session clears on window reload/unload
  useEffect(() => {
    const onBeforeUnload = () => {
      logout()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [logout])

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Desktop Hover-Expandable Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isHovered ? "w-60" : "w-16"
        } ${isDark ? "bg-[#070b14]/95 backdrop-blur-xl" : "bg-sidebar"}`}
      >
        <SidebarContent isCollapsed={!isHovered} />
      </aside>

      {/* Mobile Drawer Navigation (Slide-in) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className={`absolute left-0 top-0 bottom-0 w-60 flex flex-col border-r border-sidebar-border ${
                isDark ? "bg-[#070b14]" : "bg-sidebar"
              }`}
            >
              <SidebarContent isCollapsed={false} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Navbar Topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded gradient-primary flex items-center justify-center">
              <BarChart3 className="size-3 text-white" />
            </div>
            <span className="font-bold text-sm">DataInsight AI</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-hidden">
          <Outlet />
        </main>
      </div>

      {/* Real-time Order Notifications */}
      <div className="absolute bottom-6 right-6 z-50 pointer-events-none flex flex-col gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-indigo-500/25 bg-card/95 backdrop-blur-md shadow-2xl text-xs text-foreground"
            >
              <div className="size-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Bell className="size-4 text-indigo-400 animate-swing" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold flex justify-between">
                  <span>Live order completed!</span>
                  <span className="text-[10px] text-slate-500 font-normal">{notif.timestamp}</span>
                </div>
                <p className="text-slate-300 mt-1">
                  <b>{notif.customer}</b> purchased <b>{notif.product}</b>.
                </p>
                <div className="font-bold text-emerald-400 mt-1.5">${notif.amount}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

