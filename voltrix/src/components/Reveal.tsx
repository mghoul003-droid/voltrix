import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeUp } from '@/lib/motion'

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} variants={fadeUp} initial="hidden" whileInView="show"
      viewport={{ once: true, margin: '-80px' }} transition={{ delay }}>
      {children}
    </motion.div>
  )
}
