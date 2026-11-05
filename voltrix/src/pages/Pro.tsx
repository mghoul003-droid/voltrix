import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATS, LABEL, loadAll } from '@/lib/allProducts'
import { useColors } from './Results'

// Pro gear entries. Each must cite where the player's gear was published.
export interface ProEntry { player: string; team?: string; game: string; category: string; product: string; productId?: string; sourceUrl: string; verifiedOn?: string }
export const PRO_SEED: ProEntry[] = [] // verified entries go here; none shipped unverified
const HEAD = 'player,team,game,category,product,product_id,source_url,verified_on'
const load = (): ProEntry[] => { try { return [...PRO_SEED, ...JSON.parse(localStorage.getItem('voltrix-pro') || '[]')] } catch { return PRO_SEED } }
function parse(text: string) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean), items: ProEntry[] = [], errors: string[] = []; const h = rows[0]?.split(',').map((x) => x.trim()) ?? []
  rows.slice(1).forEach((r, i) => { const c = r.split(',').map((x) => x.trim()), g = (k: string) => c[h.indexOf(k)] ?? ''
    if (!g('player') || !g('game') || !g('product')) return errors.push(`Line ${i + 2}: player, game and product required.`)
    if (!CATS.includes(g('category'))) return errors.push(`Line ${i + 2}: category must be one of ${CATS.join(', ')}.`)
    if (!/^https?:\/\//.test(g('source_url'))) return errors.push(`Line ${i + 2}: source_url required.`)
    items.push({ player: g('player'), team: g('team') || undefined, game: g('game'), category: g('category'), product: g('product'), productId: g('product_id') || undefined, sourceUrl: g('source_url'), verifiedOn: g('verified_on') || undefined }) })
  return { items, errors }
}
const sel = 'rounded-xl border border-ink/15 bg-surface px-3 py-2 text-sm outline-none focus:border-accent'
function Import({ onDone }: { onDone: (e: ProEntry[]) => void }) {
  const [t, setT] = useState(''), [errs, setErrs] = useState<string[]>([])
  return (<div className="max-w-3xl"><p className="mb-3 text-muted">No verified pro entries yet. VOLTRIX does not guess what players use: paste rows that cite a published source. Header:</p>
    <code className="mb-3 block overflow-x-auto rounded-lg bg-surface p-3 text-xs">{HEAD}</code>
    <textarea value={t} onChange={(e) => setT(e.target.value)} rows={7} className="w-full rounded-xl border border-ink/15 bg-surface p-4 text-sm outline-none focus:border-accent" placeholder={HEAD} />
    {errs.map((e) => <p key={e} className="mt-1 text-xs text-red-400">{e}</p>)}
    <button onClick={() => { const { items, errors } = parse(t); setErrs(errors); if (items.length) { try { localStorage.setItem('voltrix-pro', JSON.stringify(items)) } catch {} onDone(items) } }} className="mt-3 rounded-full border border-accent px-6 py-3 text-sm uppercase tracking-widest text-accent">Import</button></div>)
}
const link = (en: ReturnType<typeof loadAll>, x: ProEntry) => { const m = x.productId && en.find((e) => e.p.id === x.productId); return m ? (m.cat === 'mouse' ? `#/mice/${m.p.id}` : `#/compare`) : undefined }

export function ProGear() {
  const [data, setData] = useState(load), en = useMemo(loadAll, []), col = useColors()
  const [q, setQ] = useState(''), [game, setGame] = useState(''), [cat, setCat] = useState('')
  const games = Array.from(new Set(data.map((d) => d.game)))
  const list = data.filter((d) => `${d.player} ${d.team ?? ''} ${d.product}`.toLowerCase().includes(q.toLowerCase()) && (!game || d.game === game) && (!cat || d.category === cat))
  const top = Object.entries(list.reduce<Record<string, number>>((a, d) => ({ ...a, [d.product]: (a[d.product] ?? 0) + 1 }), {})).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v).slice(0, 8)
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">Pro Gear</p><h1 className="mb-8 font-display text-3xl font-black md:text-5xl">What the pros use.</h1>
      {!data.length ? <Import onDone={setData} /> : <>
        <div className="mb-8 flex flex-wrap gap-3"><input className={`${sel} min-w-[220px] flex-1`} placeholder="Search player, team, product" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={sel} value={game} onChange={(e) => setGame(e.target.value)}><option value="">All games</option>{games.map((g) => <option key={g}>{g}</option>)}</select>
          <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All gear</option>{CATS.map((c) => <option key={c} value={c}>{LABEL[c]}</option>)}</select></div>
        <div className="mb-8 h-64 rounded-2xl border border-ink/10 bg-surface/60 p-3"><p className="text-[10px] uppercase tracking-widest text-muted">Most-listed products (current filter)</p><ResponsiveContainer><BarChart data={top}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis allowDecimals={false} stroke={col.t} /><Tooltip /><Bar dataKey="v" fill={col.a} /></BarChart></ResponsiveContainer></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((d, i) => <div key={i} className="rounded-2xl border border-ink/10 bg-surface/60 p-4"><p className="text-[10px] uppercase tracking-widest text-muted">{d.game}{d.team ? ` · ${d.team}` : ''}</p>
          <p className="font-display font-bold">{d.player}</p><p className="text-sm">{LABEL[d.category]}: {link(en, d) ? <a className="text-accent underline" href={link(en, d)}>{d.product}</a> : d.product}</p>
          <p className="mt-1 text-xs text-muted">{d.verifiedOn ? `Checked ${d.verifiedOn}` : 'Unverified date'} · <a className="text-accent underline" href={d.sourceUrl} target="_blank" rel="noreferrer">source</a></p></div>)}</div>
        <p className="mt-6 text-xs text-muted">Pro gear changes often. Entries show the date they were last checked.</p></>}
    </main>)
}

export function Games() {
  const data = useMemo(load, []), col = useColors(), games = Array.from(new Set(data.map((d) => d.game))), [g, setG] = useState('')
  const cur = g || games[0]; const rows = data.filter((d) => d.game === cur)
  const byCat = CATS.map((c) => ({ c, items: Object.entries(rows.filter((d) => d.category === c).reduce<Record<string, number>>((a, d) => ({ ...a, [d.product]: (a[d.product] ?? 0) + 1 }), {})).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v).slice(0, 6) })).filter((x) => x.items.length)
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">Gear by Game</p><h1 className="mb-8 font-display text-3xl font-black md:text-5xl">Gear, game by game.</h1>
      {!games.length ? <p className="max-w-2xl text-muted">Gear by Game is built from sourced pro-gear entries, so it fills in as verified entries are added on the <a className="text-accent underline" href="#/pro">Pro Gear</a> page. Nothing is assumed in the meantime.</p> : <>
        <div className="mb-8 flex flex-wrap gap-2">{games.map((x) => <button key={x} onClick={() => setG(x)} aria-pressed={x === cur} className={`rounded-full border px-4 py-2 text-sm ${x === cur ? 'border-accent bg-accent/10' : 'border-ink/15 text-muted'}`}>{x}</button>)}</div>
        <p className="mb-4 text-xs text-muted">Based on {rows.length} sourced pro entr{rows.length === 1 ? 'y' : 'ies'} for {cur}. Counts reflect the entries on file, not the whole scene.</p>
        <div className="grid gap-6 md:grid-cols-2">{byCat.map(({ c, items }) => <div key={c} className="h-60 rounded-2xl border border-ink/10 bg-surface/60 p-3"><p className="text-[10px] uppercase tracking-widest text-muted">{LABEL[c]}: players using</p><ResponsiveContainer><BarChart data={items} layout="vertical"><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis type="number" allowDecimals={false} stroke={col.t} /><YAxis type="category" dataKey="n" width={110} stroke={col.t} /><Tooltip /><Bar dataKey="v" fill={col.a} /></BarChart></ResponsiveContainer></div>)}</div></>}
    </main>)
}
