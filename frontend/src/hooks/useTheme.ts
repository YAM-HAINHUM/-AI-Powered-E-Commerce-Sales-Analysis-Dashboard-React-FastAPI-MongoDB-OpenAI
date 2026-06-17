/**
 * Re-export useTheme from the single ThemeProvider source of truth.
 * All components should import from here OR directly from theme-provider —
 * both resolve to the same context value.
 */
export { useTheme } from "@/components/theme-provider"
