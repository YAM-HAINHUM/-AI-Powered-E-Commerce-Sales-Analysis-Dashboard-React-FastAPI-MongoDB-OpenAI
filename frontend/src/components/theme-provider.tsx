/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

// ── Types ─────────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeContextValue {
  /** The stored preference: "dark" | "light" | "system" */
  theme: Theme
  /** The actual applied class: "dark" | "light" */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = "datainsight-theme"
const MQ = "(prefers-color-scheme: dark)"

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(MQ).matches ? "dark" : "light"
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme
}

function isValidTheme(v: string | null): v is Theme {
  return v === "dark" || v === "light" || v === "system"
}

function applyToDOM(resolved: ResolvedTheme) {
  const root = document.documentElement
  // Enable transitions ONLY during an explicit toggle (not on first paint)
  root.classList.remove("dark", "light")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

// ── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

// ── Provider ──────────────────────────────────────────────────────────────────
export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (isValidTheme(stored)) return stored
    } catch {}
    return defaultTheme
  })

  const resolvedTheme = React.useMemo(() => resolve(theme), [theme])

  // Apply DOM class whenever resolved theme changes
  React.useEffect(() => {
    applyToDOM(resolvedTheme)
  }, [resolvedTheme])

  // Mark document as ready for transitions after first paint
  React.useEffect(() => {
    // rAF ensures this runs after the browser has committed the first frame
    const raf = requestAnimationFrame(() => {
      document.documentElement.classList.add("theme-ready")
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  // Re-apply when system preference changes (only relevant if theme === "system")
  React.useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia(MQ)
    const handler = () => applyToDOM(getSystemTheme())
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  // Sync across browser tabs
  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== storageKey) return
      if (isValidTheme(e.newValue)) setThemeState(e.newValue)
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [storageKey])

  // Keyboard shortcut: press "D" to toggle (not in inputs)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key.toLowerCase() !== "d") return
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [resolvedTheme]) // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = React.useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next)
      } catch {}
      setThemeState(next)
    },
    [storageKey]
  )

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setTheme])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>")
  return ctx
}
