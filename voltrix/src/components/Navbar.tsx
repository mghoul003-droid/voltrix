import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from './Logo'
import { ThemeSwitcher } from './ThemeSwitcher'
import { ease } from '@/lib/motion'

const LINKS = [
  { href: '#top', label: 'Home' },
  { href: '#/setup', label: 'Setup Finder' },
  { href: '#/pro', label: 'Pro Gear' },
  { href: '#/games', label: 'Gear by Game' },
  { href: '#/compare', label: 'Compare' },
  { href: '#/analytics', label: 'Analytics' },
  { href: '#/finder/keyboard', label: 'Keyboards' },
  { href: '#/finder/mousepad', label: 'Mousepads' },
  { href: '#/finder/iem', label: 'IEMs' },
  { href: '#/finder/headphone', label: 'Headphones' },
  { href: '#/finder/monitor', label: 'Monitors' },
  { href: '#/mice', label: 'Mouse Database' },
  { href: '#/mouse-finder', label: 'Mouse Finder' },
  { href: '#modules', label: 'Platform' },
  { href: '#philosophy', label: 'Philosophy' },
  { href: '#photography', label: 'Gear' },
]

const FINDERS = LINKS.filter((l) => l.href.startsWith('#/finder') || l.href === '#/mouse-finder')
const MAIN = LINKS.filter((l) => ['#top', '#/setup', '#/pro', '#/games', '#/compare', '#/analytics', '#/mice'].includes(l.href))

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease, delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || open ? 'border-b border-ink/10 bg-bg/70 backdrop-blur-xl' : ''}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <a href="#top" aria-label="VOLTRIX home"><Logo /></a>
        <ul className="hidden items-center gap-5 xl:flex">
          <li className="group relative"><span tabIndex={0} className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted group-hover:text-ink">Finders</span><div className="invisible absolute left-0 top-full z-50 mt-3 w-52 rounded-xl border border-ink/10 bg-bg/95 p-2 opacity-0 backdrop-blur-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">{FINDERS.map((l) => <a key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-xs uppercase tracking-widest text-muted hover:bg-accent/10 hover:text-ink">{l.label}</a>)}</div></li>
          {MAIN.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="group relative text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink">
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button className="grid h-10 w-10 place-items-center xl:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="relative block h-3 w-6">
              <span className={`absolute left-0 h-px w-6 bg-ink transition-all ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 h-px w-6 bg-ink transition-all ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease }} className="max-h-[75vh] overflow-y-auto xl:hidden">
            {LINKS.map((l) => (
              <li key={l.href} className="px-5 py-4 font-display text-lg tracking-widest">
                <a href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
