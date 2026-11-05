import type { Variants } from 'framer-motion'
export const ease = [0.22, 1, 0.36, 1] as const
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } },
}
export const stagger = (s = 0.08): Variants => ({ hidden: {}, show: { transition: { staggerChildren: s } } })
