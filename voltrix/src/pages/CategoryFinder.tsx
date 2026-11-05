import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES, csvHeader, parseCsv, type Ans, type Category, type Part, type Product, type Q } from '@/finders/categories'
import { CATALOGS } from '@/finders/catalog'
import { Field, Num, Opt } from './MouseFinder'
import { Score, useColors } from './Results'
import { ease } from '@/lib/motion'

const avg = (p: Part[], empty: number) => { const s = p.filter((x) => x.score !== null) as { score: number }[]; return s.length ? s.reduce((a, b) => a + b.score, 0) / s.length : empty }
const sel = 'rounded-xl border border-ink/15 bg-surface px-3 py-2 text-sm outline-none focus:border-accent'
interface R { p: Product; fit: number; taste: number; budget: number | null; overall: number; parts: Part[]; tasteParts: Part[]; blocked?: string }

function score(cat: Category, p: Product, a: Ans, b: number, w: { fit: number; budget: number; taste: number }): R {
  const sc = cat.score(p.specs, a), fit = sc.blocked ? 0 : avg(sc.parts, 1), taste = avg(sc.tasteParts, 1)
  const budget = p.priceUsd != null ? Math.max(0, Math.min(1, 1 - Math.max(0, p.priceUsd - b) / (b * 0.5))) : null
  const wb = budget === null ? 0 : w.budget, tot = w.fit + wb + w.taste || 1
  return { p, fit: Math.round(fit * 100), taste: Math.round(taste * 100), budget: budget === null ? null : Math.round(budget * 100),
    overall: Math.round(((fit * w.fit + (budget ?? 0) * wb + taste * w.taste) / tot) * 100), parts: sc.parts, tasteParts: sc.tasteParts, blocked: sc.blocked }
}

export default function CategoryFinder({ id }: { id: string }) {
  const cat = CATEGORIES[id]
  const [a, setA] = useState<Ans>(() => Object.fromEntries(cat.steps.flatMap((s) => s.qs).map((q) => [q.id, q.def])))
  const [budget, setBudget] = useState(150), [w, setW] = useState({ fit: 60, budget: 20, taste: 20 })
  const [step, setStep] = useState(0), [done, setDone] = useState(false), [pick, setPick] = useState(0)
  const [fv, setFv] = useState<Record<string, string>>({}), [csv, setCsv] = useState(''), [errs, setErrs] = useState<string[]>([])
  const key = `voltrix-cat-${id}`
  const save = () => { try { localStorage.setItem('voltrix-ans-' + id, JSON.stringify(a)) } catch {} }
  const [extra, setExtra] = useState<Product[]>(() => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } })
  const col = useColors()
  const all = [...CATALOGS[id], ...extra]
  const steps: { title: string; qs: Q[] }[] = [...cat.steps, { title: 'Budget', qs: [] }], last = step === steps.length - 1
  const stepOk = last ? budget > 0 : steps[step].qs.every((q) => q.kind !== 'number' || (a[q.id] >= q.min! && a[q.id] <= q.max!))

  const ranked = useMemo(() => all.filter((p) => cat.filters.every((f) => {
    const v = fv[f.key]; if (!v) return true; const x = p.specs[f.key]; if (x === undefined) return false
    return f.kind === 'select' ? String(x) === v : f.kind === 'max' ? x <= Number(v) : x >= Number(v)
  })).map((p) => score(cat, p, a, budget, w)).sort((x, y) => y.overall - x.overall), [all.length, fv, a, budget, w, id])
  const r = ranked[Math.min(pick, ranked.length - 1)]
  const doImport = () => { const { items, errors } = parseCsv(cat, csv); setErrs(errors); if (items.length) { setExtra(items); try { localStorage.setItem(key, JSON.stringify(items)) } catch {} setCsv('') } }

  if (!done) return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">{cat.title}</p>
      <h1 className="mb-2 font-display text-3xl font-black md:text-5xl">Tell us how you play.</h1>
      <p className="mb-8 text-sm text-muted">{cat.blurb}</p>
      <div className="mb-10 flex gap-2">{steps.map((s, i) => <div key={s.title} className="flex-1"><div className="h-1 overflow-hidden rounded bg-ink/10"><motion.div className="h-full bg-accent" animate={{ width: i <= step ? '100%' : '0%' }} transition={{ ease, duration: 0.6 }} /></div>
        <p className={`mt-2 text-[10px] uppercase tracking-widest ${i === step ? 'text-accent' : 'text-muted'}`}>{s.title}</p></div>)}</div>
      <AnimatePresence mode="wait"><motion.section key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease }}>
        {last ? <>
          <Field label="Maximum budget (USD)"><Num ph="150" value={budget} onChange={setBudget} /></Field>
          {(['fit', 'budget', 'taste'] as const).map((k) => <label key={k} className="mb-4 flex items-center gap-4 text-sm"><span className="w-24 capitalize text-muted">{k}</span>
            <input type="range" min={0} max={100} value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} className="flex-1 accent-[rgb(var(--accent))]" /><span className="w-8 text-right">{w[k]}</span></label>)}</>
        : steps[step].qs.map((q) => <Field key={q.id} label={`${q.label}${q.unit ? ` (${q.unit})` : ''}`} hint={q.kind === 'number' ? `${q.hint ?? ''} Allowed: ${q.min}–${q.max} ${q.unit}.` : q.hint}>
          {q.kind === 'number' ? <Num ph={String(q.def)} value={a[q.id]} onChange={(n) => setA({ ...a, [q.id]: n })} />
            : q.options!.map((o) => <Opt key={o} v={o} cur={a[q.id]} set={(v) => setA({ ...a, [q.id]: v })}>{o}</Opt>)}</Field>)}
      </motion.section></AnimatePresence>
      <div className="mt-10 flex justify-between"><button disabled={!step} onClick={() => setStep(step - 1)} className="rounded-full px-6 py-3 text-sm uppercase tracking-widest text-muted disabled:opacity-30">Back</button>
        <button disabled={!stepOk} onClick={() => (last ? (setDone(true), setPick(0), save()) : setStep(step + 1))} className="rounded-full border border-accent bg-accent/10 px-8 py-3 text-sm uppercase tracking-widest text-accent transition hover:shadow-[0_0_30px_rgb(var(--accent)/0.4)] disabled:opacity-30">{last ? 'See results' : 'Next'}</button></div>
    </main>)

  if (!all.length) return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 md:px-8">
      <h1 className="mb-4 font-display text-3xl font-black">No verified {id}s in the catalog yet</h1>
      <p className="mb-4 text-muted">VOLTRIX never invents product data. Paste verified rows (each needs a source_url). Header:</p>
      <code className="mb-4 block overflow-x-auto rounded-lg bg-surface p-3 text-xs">{csvHeader(cat)}</code>
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} className="w-full rounded-xl border border-ink/15 bg-surface p-4 text-sm outline-none focus:border-accent" placeholder={csvHeader(cat)} />
      {errs.map((e) => <p key={e} className="mt-2 text-xs text-red-400">{e}</p>)}
      <div className="mt-4 flex gap-3"><button onClick={doImport} className="rounded-full border border-accent px-6 py-3 text-sm uppercase tracking-widest text-accent">Import</button><button onClick={() => setDone(false)} className="px-6 py-3 text-sm uppercase tracking-widest text-muted">Back</button></div>
    </main>)

  const radar = r ? [{ k: 'Fit', v: r.fit }, { k: 'Budget', v: r.budget ?? 0 }, { k: 'Taste', v: r.taste }] : []
  const bars = r ? r.parts.filter((x) => x.score !== null).map((x) => ({ n: x.label, v: Math.round(x.score! * 100) })) : []
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-28 md:px-8">
      <div className="mb-6 flex items-end justify-between"><h1 className="font-display text-3xl font-black md:text-5xl">{cat.title}</h1><button onClick={() => setDone(false)} className="text-xs uppercase tracking-widest text-accent">Edit answers</button></div>
      <div className="mb-8 flex flex-wrap gap-3">{cat.filters.map((f) => f.kind === 'select'
        ? <select key={f.key} className={sel} value={fv[f.key] ?? ''} onChange={(e) => setFv({ ...fv, [f.key]: e.target.value })} aria-label={f.label}><option value="">{f.label}: any</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
        : <input key={f.key} type="number" className={`${sel} w-44`} placeholder={f.label} value={fv[f.key] ?? ''} onChange={(e) => setFv({ ...fv, [f.key]: e.target.value })} aria-label={f.label} />)}</div>
      {!r ? <p className="text-muted">No products match these filters.</p> : <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <ol className="space-y-3">{ranked.map((x, i) => <li key={x.p.id}><button onClick={() => setPick(i)} className={`w-full rounded-2xl border p-4 text-left transition ${x === r ? 'border-accent bg-accent/10' : 'border-ink/10 bg-surface/60 hover:border-accent/50'}`}>
          <p className="text-[10px] uppercase tracking-widest text-muted">#{i + 1} · {x.p.brand} · overall {x.overall}</p><p className="mb-3 font-display font-bold">{x.p.name}</p>
          <div className="space-y-2"><Score label="Fit" v={x.fit} /><Score label="Budget" v={x.budget ?? 0} /><Score label="Taste" v={x.taste} /></div></button></li>)}</ol>
        <motion.div key={r.p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div><h2 className="font-display text-2xl font-black">{r.p.brand} {r.p.name}</h2>{r.blocked && <p className="mt-2 text-sm text-red-400">{r.blocked}</p>}</div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 rounded-2xl border border-ink/10 bg-surface/60 p-3"><ResponsiveContainer><RadarChart data={radar}><PolarGrid stroke={col.t} /><PolarAngleAxis dataKey="k" stroke={col.t} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} /><Radar dataKey="v" stroke={col.a} fill={col.a} fillOpacity={0.3} /></RadarChart></ResponsiveContainer></div>
            <div className="h-64 rounded-2xl border border-ink/10 bg-surface/60 p-3"><p className="text-center text-[10px] uppercase tracking-widest text-muted">Fit breakdown</p><ResponsiveContainer><BarChart data={bars}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis domain={[0, 100]} stroke={col.t} /><Tooltip /><Bar dataKey="v" fill={col.a} /></BarChart></ResponsiveContainer></div></div>
          <ul className="space-y-2 text-sm text-muted">{[...r.parts, ...r.tasteParts].map((x, i) => <li key={i}><span className="text-ink">{x.label} {x.score === null ? '—' : Math.round(x.score * 100)}:</span> {x.note}</li>)}
            <li>{r.p.priceUsd != null ? `$${r.p.priceUsd} vs your $${budget} budget.` : 'No USD price on file: budget unscored and left out of the overall rank.'}</li></ul>
          <table className="w-full text-sm"><tbody>{cat.cols.map((c) => { const v = r.p.specs[c.key]; return <tr key={c.key} className="border-b border-ink/10"><td className="py-2 text-muted">{c.label}</td><td className="py-2 text-right">{v === undefined ? <span className="text-muted/70">Not available</span> : c.type === 'bool' ? (v ? 'Yes' : 'No') : `${v}${c.unit ? ' ' + c.unit : ''}`}</td></tr> })}</tbody></table>
          <p className="text-xs text-muted">Source: <a className="text-accent underline" href={r.p.sourceUrl} target="_blank" rel="noreferrer">{r.p.sourceUrl}</a>{r.p.verifiedOn && ` · checked ${r.p.verifiedOn}`}. Thresholds are tunable heuristics (src/finders/categories.ts).</p>
        </motion.div></div>}
    </main>)
}
