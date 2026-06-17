import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import type { Theme } from "@/components/theme-provider"

interface ThemeToggleProps {
  /** "icon" = compact square button (default), "full" = pill with label */
  variant?: "icon" | "full"
  /** If true, cycles dark → light → system → dark */
  showSystem?: boolean
  className?: string
}

const CYCLE: Theme[] = ["dark", "light", "system"]

const ICONS = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}

const LABELS = {
  dark: "Dark",
  light: "Light",
  system: "System",
}

export function ThemeToggle({
  variant = "icon",
  showSystem = false,
  className = "",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const cycle = () => {
    const options = showSystem ? CYCLE : (["dark", "light"] as Theme[])
    const current = showSystem ? theme : resolvedTheme
    const idx = options.indexOf(current)
    setTheme(options[(idx + 1) % options.length])
  }

  const Icon = ICONS[showSystem ? theme : resolvedTheme]
  const label = LABELS[showSystem ? theme : resolvedTheme]
  const isDark = resolvedTheme === "dark"

  if (variant === "full") {
    return (
      <button
        onClick={cycle}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`
          flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
          border transition-colors cursor-pointer
          ${isDark
            ? "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-slate-100"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }
          ${className}
        `}
      >
        <IconWithAnimation Icon={Icon} themeKey={showSystem ? theme : resolvedTheme} />
        <span>{label} Mode</span>
      </button>
    )
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`
        relative size-9 rounded-xl flex items-center justify-center cursor-pointer
        border transition-colors overflow-hidden
        ${isDark
          ? "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 hover:border-indigo-500/30"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-indigo-300"
        }
        ${className}
      `}
    >
      <IconWithAnimation Icon={Icon} themeKey={showSystem ? theme : resolvedTheme} />
    </button>
  )
}

function IconWithAnimation({
  Icon,
  themeKey,
}: {
  Icon: React.ElementType
  themeKey: Theme
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={themeKey}
        initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center"
      >
        <Icon className="size-4" />
      </motion.span>
    </AnimatePresence>
  )
}
