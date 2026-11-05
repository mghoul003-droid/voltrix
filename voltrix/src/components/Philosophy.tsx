import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

const TEXT = 'Every recommendation on VOLTRIX will be grounded in real hardware, real specifications and honest comparison. No filler. No guesswork. Just precision.'

function Word({ w, p, range }: { w: string; p: MotionValue<number>; range: [number, number] }) {
  const o = useTransform(p, range, [0.15, 1])
  return <motion.span style={{ opacity: o }} className="mr-[0.25em] inline-block">{w}</motion.span>
}

export function Philosophy() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 40%'] })
  const words = TEXT.split(' ')
  return (
    <section id="philosophy" ref={ref} className="mx-auto max-w-5xl px-5 py-40 md:px-8">
      <p className="mb-8 text-xs uppercase tracking-[0.4em] text-accent">Philosophy</p>
      <p className="font-display text-2xl font-bold leading-snug md:text-5xl">
        {words.map((w, i) => <Word key={i} w={w} p={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />)}
      </p>
    </section>
  )
}
