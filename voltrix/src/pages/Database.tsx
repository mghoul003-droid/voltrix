import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CATALOG } from '@/data/mice'
import { useFavorites } from '@/lib/favorites'
import type { Mouse } from '@/lib/mouseEngine'

export function Photo({ m, className = '' }: { m: { imageUrl?: string; brand: string; name: string }; className?: string }) {
  const [bad, setBad] = useState(false)
  return m.imageUrl && !bad
    ? <img src={m.imageUrl} alt={`${m.brand} ${m.name} (manufacturer photo)`} referrerPolicy="no-referrer" onError={() => setBad(true)} loading="lazy" className={`object-contain ${className}`} />
    : <div className={`grid place-items-center text-center text-[10px] uppercase tracking-widest text-muted ${className}`}>Photo not available</div>
}
export const Heart = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }} aria-pressed={on} aria-label={on ? 'Remove favourite' : 'Add favourite'}
    className={`text-xl transition hover:scale-110 ${on ? 'text-accent' : 'text-muted'}`}>{on ? '♥' : '♡'}</button>)

const SORTS: Record<string, (a: Mouse, b: Mouse) => number> = {
  'Name A–Z': (a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`),
  'Weight: lightest': (a, b) => a.weightG - b.weightG, 'Weight: heaviest': (a, b) => b.weightG - a.weightG,
  'Length: shortest': (a, b) => a.lengthMm - b.lengthMm, 'Length: longest': (a, b) => b.lengthMm - a.lengthMm,
  'Price: low to high (USD)': (a, b) => (a.priceUsd ?? Infinity) - (b.priceUsd ?? Infinity),
}
const sel = 'rounded-xl border border-ink/15 bg-surface px-3 py-2 text-sm outline-none focus:border-accent'

export default function Database() {
  const { favs, toggle } = useFavorites()
  const [q, setQ] = useState(''), [brand, setBrand] = useState('All'), [shape, setShape] = useState('All'), [conn, setConn] = useState('All')
  const [maxW, setMaxW] = useState(''), [sort, setSort] = useState('Name A–Z'), [onlyFav, setOnlyFav] = useState(false)
  const brands = ['All', ...Array.from(new Set(CATALOG.map((m) => m.brand)))]
  const list = useMemo(() => CATALOG.filter((m) =>
    `${m.brand} ${m.name} ${m.sensor ?? ''}`.toLowerCase().includes(q.toLowerCase()) && (brand === 'All' || m.brand === brand) &&
    (shape === 'All' || m.shape === shape) && (conn === 'All' || m.connectivity === conn) && (!maxW || m.weightG <= Number(maxW)) && (!onlyFav || favs.includes(m.id))
  ).sort(SORTS[sort]), [q, brand, shape, conn, maxW, sort, onlyFav, favs])
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">Mouse database</p>
      <h1 className="mb-2 font-display text-3xl font-black md:text-5xl">{CATALOG.length} verified mice</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">Each entry cites its sources and the date it was checked. Missing data is marked, never guessed.</p>
      <div className="mb-8 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand, model, sensor" className={`${sel} min-w-[220px] flex-1`} aria-label="Search" />
        <select className={sel} value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand">{brands.map((b) => <option key={b}>{b}</option>)}</select>
        <select className={sel} value={shape} onChange={(e) => setShape(e.target.value)} aria-label="Shape">{['All', 'symmetrical', 'ergonomic-right', 'ergonomic-left'].map((b) => <option key={b}>{b}</option>)}</select>
        <select className={sel} value={conn} onChange={(e) => setConn(e.target.value)} aria-label="Connection">{['All', 'wireless', 'wired', 'both'].map((b) => <option key={b}>{b}</option>)}</select>
        <input type="number" value={maxW} onChange={(e) => setMaxW(e.target.value)} placeholder="Max weight (g)" className={`${sel} w-40`} aria-label="Max weight" />
        <select className={sel} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">{Object.keys(SORTS).map((b) => <option key={b}>{b}</option>)}</select>
        <button onClick={() => setOnlyFav(!onlyFav)} aria-pressed={onlyFav} className={`${sel} ${onlyFav ? 'border-accent text-accent' : ''}`}>♥ Favourites ({favs.length})</button>
      </div>
      {list.length === 0 && <p className="text-muted">No mice match these filters.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m, i) => (
          <motion.a key={m.id} href={`#/mice/${m.id}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -6 }}
            className="rounded-2xl border border-ink/10 bg-surface/70 p-5 transition-colors hover:border-accent/50">
            <div className="mb-4 flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-widest text-muted">{m.brand}</p><h2 className="font-display text-lg font-bold">{m.name}</h2></div>
              <Heart on={favs.includes(m.id)} onClick={() => toggle(m.id)} /></div>
            <Photo m={m} className="mb-4 h-40 w-full rounded-xl bg-bg/50" />
            <p className="text-xs text-muted">{m.lengthMm} × {m.widthMm} × {m.heightMm} mm · {m.weightG} g · {m.connectivity}</p>
            <p className="mt-1 text-xs text-muted">{m.priceUsd != null ? `$${m.priceUsd}` : 'Price not available'} · checked {m.verifiedOn ?? 'n/a'}</p>
          </motion.a>))}
      </div>
    </main>)
}
