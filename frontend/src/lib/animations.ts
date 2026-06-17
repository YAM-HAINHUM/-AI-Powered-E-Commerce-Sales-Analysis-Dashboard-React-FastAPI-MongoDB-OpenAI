/**
 * Shared Framer Motion variants — typed for Framer Motion v12+.
 * Import these instead of defining inline `fadeUp` objects in every file.
 */
import type { Variants, Transition } from "framer-motion"

// Framer Motion v12 requires `ease` as a named easing or EasingFunction.
// We cast to `Transition` to keep our cubic-bezier array working.
const spring: Transition = { type: "tween", ease: [0.22, 1, 0.36, 1] as unknown as string } as Transition

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ...spring } as Transition,
  }),
}

export const fadeUpFast: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ...spring } as Transition,
  }),
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
