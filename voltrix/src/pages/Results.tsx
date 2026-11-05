import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { parseCsv, type Mouse, type Profile, type Result } from '@/lib/mouseEngine'
import { CSV_TEMPLATE } from '@/data/mice'
import { useTheme } from '@/theme/ThemeProvider'

export function useColors() {
  const { theme } = useTheme()
  const [c, setC] = useState({ a: '#00e5ff', b: '#96cdff', t: '#8a9aaa' })
  useEffect(() => { const id = requestAnimationFrame(() => { const s = getComputedStyle(document.documentElement)
    const g = (k: string) => `rgb(${s.getPropertyValue(k).trim().split(/\s+/).join(',')})`; setC({ a: g('--accent'), b: g('--accent2'), t: g('--muted') }) }); return () => cancelAnimationFrame(id) }, [theme])
  return c
}
export const Score = ({ label, v }: { label: string; v: number }) => (
  <div><div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-muted"><span>{label}</span><span className="text-ink">{v}</span></div>
    <div className="h-1.5 overflow-hidden rounded bg-ink/10"><motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.9 }} /></div></div>)

export function Results({ p, ranked, onEdit, onImport, hasData }: { p: Profile; ranked: Result[]; onEdit: () => void; onImport: (m: Mouse[]) => void; hasData: boolean }) {
  const [sel, setSel] = useState(0); const [csv, setCsv] = useState(''); const [errs, setErrs] = useState<string[]>([]); const col = useColors()
  const r = ranked[sel]
  const doImport = () => { const { mice, errors } = parseCsv(csv); setErrs(errors); if (mice.length) { onImport(mice); setCsv('') } }

  if (!hasData) return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 md:px-8">
      <h1 className="mb-4 font-display text-3xl font-black">No verified mice in the catalog yet</h1>
      <p className="mb-6 text-muted">VOLTRIX never invents product specs. Paste verified rows below (each needs a source_url). Header:</p>
      <code className="mb-4 block overflow-x-auto rounded-lg bg-surface p-3 text-xs">{CSV_TEMPLATE}</code>
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} className="w-full rounded-xl border border-ink/15 bg-surface p-4 text-sm outline-none focus:border-accent" placeholder={CSV_TEMPLATE} />
      {errs.map((e) => <p key={e} className="mt-2 text-xs text-red-400">{e}</p>)}
      <div className="mt-4 flex gap-3"><button onClick={doImport} className="rounded-full border border-accent px-6 py-3 text-sm uppercase tracking-widest text-accent">Import</button>
        <button onClick={onEdit} className="px-6 py-3 text-sm uppercase tracking-widest text-muted">Back</button></div>
    </main>)

  const radar = [{ k: 'Ergonomic', v: r.ergo }, { k: 'Budget', v: r.budget }, { k: 'Taste', v: r.taste }]
  const dims = [{ n: 'Length', mouse: r.mouse.lengthMm, ideal: r.ideal.lengthMm }, { n: 'Width', mouse: r.mouse.widthMm, ideal: r.ideal.widthMm },
    { n: 'Height', mouse: r.mouse.heightMm, ideal: Math.round((r.ideal.heightMin + r.ideal.heightMax) / 2) }]
  const top = ranked.slice(0, 5).map((x) => ({ n: x.mouse.name, Ergonomic: x.ergo, Budget: x.budget, Taste: x.taste }))
  const spec = [['Length', `${r.mouse.lengthMm} mm`], ['Width', `${r.mouse.widthMm} mm`], ['Height', `${r.mouse.heightMm} mm`], ['Weight', `${r.mouse.weightG} g`], ['Shape', r.mouse.shape],
    ['Hump', r.mouse.hump ?? 'not recorded'], ['Price (USD)', r.mouse.priceUsd != null ? `$${r.mouse.priceUsd}` : 'not available'], ['Connection', r.mouse.connectivity]]
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-28 md:px-8">
      <div className="mb-8 flex items-end justify-between"><h1 className="font-display text-3xl font-black md:text-5xl">Your matches</h1>
        <button onClick={onEdit} className="text-xs uppercase tracking-widest text-accent">Edit answers</button></div>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <ol className="space-y-3">{ranked.map((x, i) => (
          <li key={x.mouse.id}><button onClick={() => setSel(i)} className={`w-full rounded-2xl border p-4 text-left transition ${i === sel ? 'border-accent bg-accent/10' : 'border-ink/10 bg-surface/60 hover:border-accent/50'}`}>
            <p className="text-[10px] uppercase tracking-widest text-muted">#{i + 1} · {x.mouse.brand} · overall {x.overall}</p>
            <p className="mb-3 font-display font-bold">{x.mouse.name}</p>
            <div className="space-y-2"><Score label="Ergonomic" v={x.ergo} /><Score label="Budget" v={x.budget} /><Score label="Taste" v={x.taste} /></div></button></li>))}</ol>
        <motion.div key={r.mouse.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div><h2 className="font-display text-2xl font-black">{r.mouse.brand} {r.mouse.name}</h2>
            {r.blocked && <p className="mt-2 text-sm text-red-400">{r.blocked}</p>}</div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 rounded-2xl border border-ink/10 bg-surface/60 p-3"><ResponsiveContainer><RadarChart data={radar}><PolarGrid stroke={col.t} /><PolarAngleAxis dataKey="k" stroke={col.t} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="v" stroke={col.a} fill={col.a} fillOpacity={0.3} /></RadarChart></ResponsiveContainer></div>
            <div className="h-64 rounded-2xl border border-ink/10 bg-surface/60 p-3"><p className="text-center text-[10px] uppercase tracking-widest text-muted">Mouse vs your target (mm)</p>
              <ResponsiveContainer><BarChart data={dims}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis stroke={col.t} /><Tooltip /><Legend />
                <Bar dataKey="mouse" fill={col.a} name="Mouse" /><Bar dataKey="ideal" fill={col.b} name="Target" /></BarChart></ResponsiveContainer></div></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div><h3 className="mb-3 font-display text-sm uppercase tracking-widest">Ergonomic ({r.ergo})</h3><ul className="space-y-2 text-sm text-muted">{r.ergoParts.map((x) => <li key={x.key}><span className="text-ink">{x.label} {x.score ? Math.round(x.score * 100) : '—'}:</span> {x.note}</li>)}</ul></div>
            <div><h3 className="mb-3 font-display text-sm uppercase tracking-widest">Budget ({r.budget}) · Taste ({r.taste})</h3><ul className="space-y-2 text-sm text-muted"><li>{r.budgetNote}</li>
              {r.tasteParts.length ? r.tasteParts.map((x) => <li key={x.key}>{x.note}</li>) : <li>No taste preferences set, so every mouse scores 100.</li>}</ul></div></div>
          <table className="w-full text-sm"><tbody>{spec.map(([k, v]) => <tr key={k} className="border-b border-ink/10"><td className="py-2 text-muted">{k}</td><td className="py-2 text-right">{v}</td></tr>)}</tbody></table>
          <p className="text-xs text-muted">Specs source: <a className="text-accent underline" href={r.mouse.sourceUrl} target="_blank" rel="noreferrer">{r.mouse.sourceUrl}</a>. Fit thresholds are tunable heuristics (src/lib/mouseEngine.ts), not medical advice.</p>
          <div><h3 className="mb-3 font-display text-sm uppercase tracking-widest">Alternatives</h3><div className="grid gap-3 sm:grid-cols-3">
            {ranked.filter((_, i) => i !== sel).slice(0, 3).map((x) => <button key={x.mouse.id} onClick={() => setSel(ranked.indexOf(x))} className="rounded-xl border border-ink/10 p-3 text-left text-sm hover:border-accent/50">
              {x.mouse.brand} {x.mouse.name}<br /><span className="text-xs text-muted">E{x.ergo} · B{x.budget} · T{x.taste}</span></button>)}</div></div>
          {ranked.length > 1 && <div className="h-72 rounded-2xl border border-ink/10 bg-surface/60 p-3"><p className="text-center text-[10px] uppercase tracking-widest text-muted">Top matches: three scores</p>
            <ResponsiveContainer><BarChart data={top}><CartesianGrid stroke={col.t} strokeOpacity={0.2} /><XAxis dataKey="n" stroke={col.t} /><YAxis domain={[0, 100]} stroke={col.t} /><Tooltip /><Legend />
              <Bar dataKey="Ergonomic" fill={col.a} /><Bar dataKey="Budget" fill={col.b} /><Bar dataKey="Taste" fill={col.t} /></BarChart></ResponsiveContainer></div>}
        </motion.div>
      </div>
    </main>)
}
