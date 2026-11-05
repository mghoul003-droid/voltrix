import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES } from '@/finders/categories'
import { CATS, LABEL, loadAll, type Entry } from '@/lib/allProducts'
import { evaluate, type Profile } from '@/lib/mouseEngine'
import { Photo } from './Database'
import { useColors } from './Results'

const rd = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
const mean = (p: { score: number | null }[]) => { const s = p.filter((x) => x.score !== null) as { score: number }[]; return s.length ? s.reduce((a, b) => a + b.score, 0) / s.length : 1 }
interface Item { e: Entry; price: number; score: number; flag?: string }

function fit(e: Entry): { score: number; flag?: string } | null {
  if (e.cat === 'mouse') {
    const pr = rd('voltrix-ans-mouse') as Profile | null
    if (!pr) return { score: 0.5, flag: 'Unscored: complete the Mouse Finder for a real fit.' }
    const r = evaluate(e.raw!, pr); return r.blocked ? null : { score: (r.ergo * 0.7 + r.taste * 0.3) / 100 }
  }
  const c = CATEGORIES[e.cat], saved = rd('voltrix-ans-' + e.cat)
  const a = saved ?? Object.fromEntries(c.steps.flatMap((s) => s.qs).map((q) => [q.id, q.def]))
  const sc = c.score(e.p.specs, a); if (sc.blocked) return null
  return { score: 0.7 * mean(sc.parts) + 0.3 * mean(sc.tasteParts), flag: saved ? undefined : 'Scored with default answers: complete this finder to personalise.' }
}

export default function Setup() {
  const all = useMemo(loadAll, []), col = useColors()
  const [budget, setBudget] = useState(0), [on, setOn] = useState<string[]>(['mouse', 'keyboard', 'mousepad', 'headphone', 'monitor'])
  const [w, setW] = useState<Record<string, number>>(Object.fromEntries(CATS.map((c) => [c, 50])))
  const cand = useMemo(() => Object.fromEntries(CATS.map((c) => [c, all.filter((e) => e.cat === c && e.p.priceUsd != null).flatMap((e) => { const f = fit(e); return f ? [{ e, price: e.p.priceUsd!, ...f } as Item] : [] }).sort((a, b) => b.score - a.score).slice(0, 10)])), [all])
  const unpriced = (c: string) => all.filter((e) => e.cat === c && e.p.priceUsd == null).length
  const out = useMemo(() => {
    if (!(budget > 0)) return null
    let cs = on.filter((c) => cand[c].length).sort((a, b) => w[a] - w[b]); const dropped: string[] = []
    const solve = (set: string[]) => { let best: { items: Item[]; val: number; cost: number } | null = null
      const rec = (i: number, items: Item[], cost: number, v: number) => { if (cost > budget) return; if (i === set.length) { if (!best || v > best.val) best = { items: [...items], val: v, cost }; return }
        for (const it of cand[set[i]]) rec(i + 1, [...items, it], cost + it.price, v + w[set[i]] * it.score) }
      rec(0, [], 0, 0); return best as { items: Item[]; val: number; cost: number } | null }
    let b = solve(cs); while (!b && cs.length) { dropped.push(cs[0]); cs = cs.slice(1); b = solve(cs) }
    return { b, dropped, empty: on.filter((c) => !cand[c].length) }
  }, [budget, on, w, cand])
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">Complete Setup Finder</p>
      <h1 className="mb-2 font-display text-3xl font-black md:text-5xl">Your whole setup, one budget.</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">Picks one verified, priced product per category to maximise your weighted fit without exceeding the budget. Fit uses your finder answers; run each finder first for personalised results.</p>
      <label className="mb-6 block text-sm"><span className="mb-1 block font-display text-xs uppercase tracking-widest">Total budget (USD, hard limit)</span>
        <input type="number" value={budget || ''} onChange={(e) => setBudget(Number(e.target.value))} placeholder="e.g. 800" className="w-48 rounded-xl border border-ink/15 bg-surface px-4 py-3 outline-none focus:border-accent" /></label>
      <div className="mb-10 grid gap-3 sm:grid-cols-2">{CATS.map((c) => <div key={c} className={`rounded-xl border p-3 transition ${on.includes(c) ? 'border-accent/60' : 'border-ink/10 opacity-60'}`}>
        <label className="flex items-center justify-between text-sm"><span>{LABEL[c]}</span><input type="checkbox" checked={on.includes(c)} onChange={() => setOn(on.includes(c) ? on.filter((x) => x !== c) : [...on, c])} /></label>
        <input type="range" min={1} max={100} value={w[c]} disabled={!on.includes(c)} onChange={(e) => setW({ ...w, [c]: Number(e.target.value) })} className="mt-2 w-full accent-[rgb(var(--accent))]" aria-label={`${LABEL[c]} priority`} />
        <p className="mt-1 text-[10px] text-muted">{cand[c].length} priced candidate(s){unpriced(c) ? ` · ${unpriced(c)} excluded: no verified price` : ''}</p></div>)}</div>
      {out && (out.b ? <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <p className="font-display text-2xl font-black">${out.b.cost.toFixed(2)} <span className="text-sm font-normal text-muted">of ${budget} · ${(budget - out.b.cost).toFixed(2)} left</span></p>
        {out.dropped.length > 0 && <p className="text-sm text-red-400">Nothing fits every category in budget, so these were dropped: {out.dropped.map((c) => LABEL[c]).join(', ')}.</p>}
        <div className="grid gap-4 sm:grid-cols-2">{out.b.items.map((it) => <div key={it.e.p.id} className="rounded-2xl border border-ink/10 bg-surface/60 p-4">
          <Photo m={it.e.p} className="mb-3 h-28 w-full rounded-lg bg-bg/50" /><p className="text-[10px] uppercase tracking-widest text-muted">{LABEL[it.e.cat]} · {it.e.p.brand}</p><p className="font-display font-bold">{it.e.p.name}</p>
          <p className="text-sm">${it.price} · fit {Math.round(it.score * 100)}</p>
          <p className="mt-1 text-xs text-muted">{it.e.p.verifiedOn ? `Verified ${it.e.p.verifiedOn}` : 'Unverified date'} · <a className="text-accent underline" href={it.e.p.sourceUrl} target="_blank" rel="noreferrer">source</a></p>
          {it.flag && <p className="mt-1 text-xs text-yellow-400">{it.flag}</p>}{it.e.p.notes?.some((n) => /not verified/i.test(n)) && <p className="mt-1 text-xs text-yellow-400">Specs rest on third-party sources, not the manufacturer.</p>}</div>)}</div>
        <div className="h-60 rounded-2xl border border-ink/10 bg-surface/60 p-3"><p className="text-[10px] uppercase tracking-widest text-muted">Spend by category (USD)</p><ResponsiveContainer><BarChart data={out.b.items.map((i) => ({ n: LABEL[i.e.cat], v: i.price }))}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis stroke={col.t} /><Tooltip /><Bar dataKey="v" fill={col.a} /></BarChart></ResponsiveContainer></div>
      </motion.div> : <p className="text-muted">No verified, priced products are available for the selected categories yet. Add data through the category finders.</p>)}
      {out && out.empty.length > 0 && out.b && <p className="mt-6 text-xs text-muted">No verified priced products for: {out.empty.map((c) => LABEL[c]).join(', ')}.</p>}
    </main>)
}
