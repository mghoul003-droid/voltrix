import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// Photography slots. Drop licensed or self-shot hardware photos into /public/images
// and set `src`. Nothing is generated or faked: empty slots stay visibly empty.
const SLOTS: { label: string; src?: string }[] = [
  { label: 'Hardware photography slot 01' },
  { label: 'Hardware photography slot 02' },
  { label: 'Hardware photography slot 03' },
]

export function PhotoShowcase() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60])
  const y2 = useTransform(scrollYProgress, [0, 1], [-40, 80])
  const ys = [y1, y2, y1]
  return (
    <section id="photography" ref={ref} className="mx-auto max-w-7xl px-5 pb-32 md:px-8">
      <p className="mb-4 text-xs uppercase tracking-[0.4em] text-accent">Gear</p>
      <h2 className="mb-14 max-w-2xl font-display text-3xl font-black md:text-5xl">Real hardware. Real photography.</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {SLOTS.map((s, i) => (
          <motion.figure key={i} style={{ y: ys[i] }} whileHover={{ scale: 1.02 }}
            className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink/10 bg-surface">
            {s.src ? <img src={s.src} alt={s.label} className="h-full w-full object-cover" loading="lazy" /> : (
              <div className="grid h-full place-items-center p-6 text-center text-xs uppercase tracking-widest text-muted">
                <span className="grid-bg absolute inset-0" /><span className="relative">{s.label}</span>
              </div>
            )}
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
