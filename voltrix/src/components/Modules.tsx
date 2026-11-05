import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { MODULES } from '@/data/modules'
import { Reveal } from './Reveal'
import { stagger, fadeUp } from '@/lib/motion'

const HREFS: Record<string, string> = { mouse: '#/mouse-finder', keyboard: '#/finder/keyboard', mousepad: '#/finder/mousepad', iem: '#/finder/iem', headphone: '#/finder/headphone', monitor: '#/finder/monitor', setup: '#/setup', pro: '#/pro', game: '#/games', compare: '#/compare', analytics: '#/analytics' }
function Card({ index, title, blurb, href }: { index: number; title: string; blurb: string; href?: string }) {
  const x = useMotionValue(0), y = useMotionValue(0)
  const spot = useMotionTemplate`radial-gradient(260px circle at ${x}px ${y}px, rgb(var(--accent) / 0.16), transparent 70%)`
  return (
    <motion.article variants={fadeUp} whileHover={{ y: -6 }}
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set(e.clientX - r.left); y.set(e.clientY - r.top) }}
      className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-surface/70 p-7 transition-colors hover:border-accent/50">
      <motion.div style={{ backgroundImage: spot }} className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-10 flex items-center justify-between text-xs tracking-widest text-muted">
          <span className="font-display">{String(index + 1).padStart(2, '0')}</span>
          {href ? <a href={href} className="rounded-full border border-accent px-3 py-1 uppercase text-accent after:absolute after:inset-0">Open →</a> : <span className="rounded-full border border-ink/15 px-3 py-1 uppercase">Coming soon</span>}
        </div>
        <h3 className="font-display text-xl font-bold tracking-wide">{title}</h3>
        <p className="mt-3 text-sm text-muted">{blurb}</p>
      </div>
    </motion.article>
  )
}

export function Modules() {
  return (
    <section id="modules" className="relative mx-auto max-w-7xl px-5 py-32 md:px-8">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.4em] text-accent">The platform</p>
        <h2 className="max-w-3xl font-display text-3xl font-black md:text-5xl">Eleven tools. One system built around you.</h2>
      </Reveal>
      <motion.div variants={stagger(0.07)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
        className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m, i) => <Card key={m.id} index={i} title={m.title} blurb={m.blurb} href={HREFS[m.id]} />)}
      </motion.div>
    </section>
  )
}
