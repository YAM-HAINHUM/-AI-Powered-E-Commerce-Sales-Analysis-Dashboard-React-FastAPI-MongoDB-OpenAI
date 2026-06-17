import { useEffect, useRef, useState, memo } from "react"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"

interface LiveKPICardProps {
  icon: React.ElementType
  label: string
  /** Raw number (not pre-formatted) */
  value: number
  /** Displayed change string e.g. "+18.3%" */
  change: string
  /** Tailwind bg class for the icon square */
  color: string
  /** Formatter function — receives the animated number */
  format: (n: number) => string
  index: number
  /** Shows a tiny "live" pulse when true */
  live?: boolean
}

/**
 * Animates a number from its previous value to the new one.
 * Uses requestAnimationFrame for 60fps smoothness — no library needed.
 */
function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target)
  const prevRef   = useRef(target)
  const startRef  = useRef<number | null>(null)
  const frameRef  = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current
    if (from === target) return
    startRef.current = null

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setDisplay(from + (target - from) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        prevRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return display
}

export const LiveKPICard = memo(function LiveKPICard({
  icon: Icon,
  label,
  value,
  change,
  color,
  format,
  index,
  live = false,
}: LiveKPICardProps) {
  const animated = useAnimatedNumber(value)
  const isPositive = change.startsWith("+")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="glass-card rounded-xl p-5 cursor-default relative overflow-hidden"
    >
      {/* Live indicator */}
      {live && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="size-4 text-white" />
        </div>
      </div>

      <div className="text-2xl font-bold mb-1 tabular-nums">
        {format(animated)}
      </div>

      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
        <TrendingUp className={`size-3 ${isPositive ? "" : "rotate-180"}`} />
        {change} vs last month
      </div>
    </motion.div>
  )
})
