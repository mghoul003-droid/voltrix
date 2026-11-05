import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { ease } from '@/lib/motion'

const WORDS = ['PRECISION', 'MEETS', 'PERFORMANCE.']

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const mx = useSpring(useMotionValue(50), { stiffness: 60, damping: 20 })
  const my = useSpring(useMotionValue(40), { stiffness: 60, damping: 20 })
  const glow = useMotionTemplate`radial-gradient(600px circle at ${mx}% ${my}%, rgb(var(--accent) / 0.18), transparent 60%)`

  return (
    <section id="top" ref={ref} className="noise relative flex min-h-screen items-center overflow-hidden"
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(((e.clientX - r.left) / r.width) * 100); my.set(((e.clientY - r.top) / r.height) * 100) }}>
      <motion.div style={{ backgroundImage: glow }} className="absolute inset-0" />
      <motion.div style={{ y: gridY }} className="grid-bg absolute inset-0 -top-20" />
      <motion.div style={{ y: textY, opacity: fade }} className="relative mx-auto w-full max-w-7xl px-5 pt-24 md:px-8">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8, ease }}
          className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-accent">
          <span className="h-px w-10 bg-accent" /> Gaming gear discovery
        </motion.p>
        <h1 className="font-display text-[clamp(1.8rem,7.2vw,8rem)] font-black leading-[0.95] tracking-tight">
          {WORDS.map((w, i) => (
            <span key={w} className="block overflow-hidden pb-2">
              <motion.span className={`block ${i === 1 ? 'text-transparent [-webkit-text-stroke:1px_rgb(var(--accent))]' : ''}`}
                initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.6 + i * 0.14, duration: 1.1, ease }}>
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.9, ease }}
          className="mt-8 max-w-xl text-lg text-muted">
          A premium platform for finding the gaming gear that fits you. Foundation build: the finders are on the way.
        </motion.p>
        <motion.a href="#modules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="mt-10 inline-flex items-center gap-3 rounded-full border border-accent/60 bg-accent/10 px-8 py-4 text-sm uppercase tracking-[0.25em] text-accent backdrop-blur transition-shadow hover:shadow-[0_0_40px_rgb(var(--accent)/0.4)]">
          Explore the platform <span aria-hidden>→</span>
        </motion.a>
      </motion.div>
      <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}
        className="absolute bottom-8 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-accent to-transparent" />
    </section>
  )
}
