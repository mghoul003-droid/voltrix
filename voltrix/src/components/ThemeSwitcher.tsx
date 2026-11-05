import { motion } from 'framer-motion'
import { THEMES, useTheme } from '@/theme/ThemeProvider'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-surface/60 p-1" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => (
        <button key={t.id} role="radio" aria-checked={theme === t.id} title={t.label} aria-label={t.label}
          onClick={() => setTheme(t.id)} className="relative grid h-6 w-6 place-items-center rounded-full">
          {theme === t.id && <motion.span layoutId="theme-ring" className="absolute inset-0 rounded-full border border-accent" />}
          <span className="h-3 w-3 rounded-full" style={{ background: t.swatch }} />
        </button>
      ))}
    </div>
  )
}
