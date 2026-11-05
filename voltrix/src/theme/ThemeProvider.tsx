import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export const THEMES = [
  { id: 'electric', label: 'Dark Electric', swatch: '#00e5ff' },
  { id: 'violet', label: 'Cyber Violet', swatch: '#a855f7' },
  { id: 'chrome', label: 'Arctic Chrome', swatch: '#c9d3df' },
  { id: 'phantom', label: 'Phantom', swatch: '#ebebeb' },
] as const
export type ThemeId = (typeof THEMES)[number]['id']

const Ctx = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void }>({ theme: 'electric', setTheme: () => {} })
export const useTheme = () => useContext(Ctx)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(() => {
    try {
      const s = localStorage.getItem('voltrix-theme') as ThemeId | null
      if (s && THEMES.some((t) => t.id === s)) return s
    } catch {}
    return 'electric'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('voltrix-theme', theme) } catch {}
  }, [theme])
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}
