import { useCallback, useState } from 'react'
const KEY = 'voltrix-favs'
const load = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
export function useFavorites() {
  const [favs, setFavs] = useState<string[]>(load)
  const toggle = useCallback((id: string) => setFavs((f) => {
    const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
    try { localStorage.setItem(KEY, JSON.stringify(n)) } catch {}
    return n }), [])
  return { favs, toggle }
}
