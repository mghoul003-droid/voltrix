import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { CATS, LABEL, NA, colsFor, loadAll, numCols, val, type Entry } from '@/lib/allProducts'
import { Photo } from './Database'
import { useColors } from './Results'

const sel = 'rounded-xl border border-ink/15 bg-surface px-3 py-2 text-sm outline-none focus:border-accent'
const show = (v: any, u?: string) => (v === undefined || v === null ? <span className="text-muted/70">{NA}</span> : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : `${v}${u ? ' ' + u : ''}`)

export function Compare() {
  const all = useMemo(loadAll, []), col = useColors()
  const [cat, setCat] = useState('mouse'), [ids, setIds] = useState<string[]>([]), [metric, setMetric] = useState('')
  const pool = all.filter((e) => e.cat === cat), chosen = ids.map((i) => pool.find((e) => e.p.id === i)).filter(Boolean) as Entry[]
  const nc = numCols(cat), m = nc.some((x) => x.key === metric) ? metric : nc[0].key
  const data = chosen.map((e) => ({ n: e.p.name, v: val(e.p, m) })).filter((d) => d.v != null)
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 4 ? [...ids, id] : ids)
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">Compare</p>
      <h1 className="mb-8 font-display text-3xl font-black md:text-5xl">Up to four, side by side.</h1>
      <div className="mb-6 flex flex-wrap items-center gap-3"><select className={sel} value={cat} onChange={(e) => { setCat(e.target.value); setIds([]) }} aria-label="Category">{CATS.map((c) => <option key={c} value={c}>{LABEL[c]}</option>)}</select>
        <span className="text-xs text-muted">{ids.length}/4 selected</span></div>
      {!pool.length && <p className="text-muted">No verified {LABEL[cat].toLowerCase()}s in the catalog yet. Add data via the {LABEL[cat].toLowerCase()} finder import.</p>}
      <div className="mb-10 flex flex-wrap gap-2">{pool.map((e) => <button key={e.p.id} onClick={() => toggle(e.p.id)} aria-pressed={ids.includes(e.p.id)} disabled={!ids.includes(e.p.id) && ids.length >= 4}
        className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-30 ${ids.includes(e.p.id) ? 'border-accent bg-accent/10' : 'border-ink/15 text-muted hover:border-accent/50'}`}>{e.p.brand} {e.p.name}</button>)}</div>
      {chosen.length > 0 && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr><th className="w-36" />{chosen.map((e) => <th key={e.p.id} className="p-3 text-left align-top"><Photo m={e.p} className="mb-2 h-24 w-full rounded-lg bg-surface/60" />
          <p className="text-[10px] uppercase tracking-widest text-muted">{e.p.brand}</p><p className="font-display">{e.p.name}</p></th>)}</tr></thead>
          <tbody>{[['Price (USD)', (e: Entry) => show(e.p.priceUsd != null ? `$${e.p.priceUsd}` : undefined)], ['Last verified', (e: Entry) => show(e.p.verifiedOn)],
            ...colsFor(cat).map((c) => [c.label, (e: Entry) => show(e.p.specs[c.key], c.unit)] as const)].map(([k, f]: any) => <tr key={k} className="border-t border-ink/10"><td className="py-2 text-muted">{k}</td>{chosen.map((e) => <td key={e.p.id} className="p-3">{f(e)}</td>)}</tr>)}
            <tr className="border-t border-ink/10"><td className="py-2 text-muted">Source</td>{chosen.map((e) => <td key={e.p.id} className="p-3"><a className="text-accent underline" href={e.p.sourceUrl} target="_blank" rel="noreferrer">link</a></td>)}</tr></tbody></table></div>
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4"><div className="mb-3 flex items-center gap-3"><span className="text-xs uppercase tracking-widest text-muted">Chart</span>
          <select className={sel} value={m} onChange={(e) => setMetric(e.target.value)}>{nc.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></div>
          <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis stroke={col.t} /><Tooltip /><Bar dataKey="v" fill={col.a} /></BarChart></ResponsiveContainer></div>
          {data.length < chosen.length && <p className="mt-2 text-xs text-muted">{chosen.length - data.length} product(s) omitted: this value is not available.</p>}</div></motion.div>}
    </main>)
}

export function Analytics() {
  const all = useMemo(loadAll, []), col = useColors()
  const [cat, setCat] = useState('mouse'), [xk, setX] = useState(''), [yk, setY] = useState('')
  const pool = all.filter((e) => e.cat === cat), nc = numCols(cat), x = nc.some((c) => c.key === xk) ? xk : nc[0].key, y = nc.some((c) => c.key === yk) ? yk : nc[Math.min(1, nc.length - 1)].key
  const cols = colsFor(cat)
  const comp = pool.map((e) => ({ n: e.p.name, v: Math.round(((cols.filter((c) => e.p.specs[c.key] !== undefined).length + (e.p.priceUsd != null ? 1 : 0) + (e.p.imageUrl ? 1 : 0)) / (cols.length + 2)) * 100) }))
  const pts = pool.filter((e) => val(e.p, x) != null && val(e.p, y) != null).map((e) => ({ x: val(e.p, x) as number, y: val(e.p, y) as number, n: e.p.name }))
  const perCat = CATS.map((c) => ({ n: LABEL[c], v: all.filter((e) => e.cat === c).length }))
  const lab = (k: string) => nc.find((c) => c.key === k)!.label
  const card = 'rounded-2xl border border-ink/10 bg-surface/60 p-4'
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">Analytics</p>
      <h1 className="mb-8 font-display text-3xl font-black md:text-5xl">The data behind the picks.</h1>
      <div className={`${card} mb-6 h-64`}><p className="mb-2 text-[10px] uppercase tracking-widest text-muted">Verified products per category</p><ResponsiveContainer><BarChart data={perCat}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis allowDecimals={false} stroke={col.t} /><Tooltip /><Bar dataKey="v" fill={col.a} /></BarChart></ResponsiveContainer></div>
      <select className={`${'rounded-xl border border-ink/15 bg-surface px-3 py-2 text-sm'} mb-6`} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">{CATS.map((c) => <option key={c} value={c}>{LABEL[c]}</option>)}</select>
      {!pool.length ? <p className="text-muted">No {LABEL[cat].toLowerCase()} data yet.</p> : <div className="grid gap-6 md:grid-cols-2">
        <div className={`${card} h-72`}><p className="mb-2 text-[10px] uppercase tracking-widest text-muted">Data completeness (% of specs, price and photo on file)</p><ResponsiveContainer><BarChart data={comp}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis domain={[0, 100]} stroke={col.t} /><Tooltip /><Bar dataKey="v" fill={col.b} /></BarChart></ResponsiveContainer></div>
        <div className={`${card} h-72`}><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">X<select className="rounded border border-ink/15 bg-surface px-2 py-1" value={x} onChange={(e) => setX(e.target.value)}>{nc.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
          Y<select className="rounded border border-ink/15 bg-surface px-2 py-1" value={y} onChange={(e) => setY(e.target.value)}>{nc.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
          <ResponsiveContainer><ScatterChart><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="x" name={lab(x)} stroke={col.t} type="number" domain={['auto', 'auto']} /><YAxis dataKey="y" name={lab(y)} stroke={col.t} type="number" domain={['auto', 'auto']} />
            <Tooltip content={({ payload }) => (payload?.length ? <div className="rounded bg-surface p-2 text-xs">{(payload[0].payload as any).n}: {(payload[0].payload as any).x} / {(payload[0].payload as any).y}</div> : null)} /><Scatter data={pts} fill={col.a} /></ScatterChart></ResponsiveContainer>
          {pts.length < pool.length && <p className="text-xs text-muted">{pool.length - pts.length} product(s) omitted: a value is not available.</p>}</div></div>}
    </main>)
}
