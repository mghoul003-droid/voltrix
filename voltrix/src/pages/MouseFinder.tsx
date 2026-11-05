import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { VARIATIONS, rank, type Grip, type Mouse, type Profile } from '@/lib/mouseEngine'
import { CATALOG } from '@/data/mice'
import { Results } from './Results'
import { ease } from '@/lib/motion'

const init: Profile = { handLenCm: 0, handWidCm: 0, hand: 'right', grip: 'claw', variation: 'relaxed', lift: 'sometimes',
  shapePref: 'any', weightPref: 'any', connPref: 'any', budget: 100, priority: { ergo: 60, budget: 20, taste: 20 } }
const STEPS = ['Hand', 'Grip', 'Preferences', 'Budget']

export function Opt<T extends string>({ v, cur, set, children }: { v: T; cur: T; set: (v: T) => void; children: ReactNode }) {
  return <button type="button" onClick={() => set(v)} aria-pressed={cur === v}
    className={`rounded-xl border px-4 py-3 text-left text-sm transition-all hover:-translate-y-0.5 ${cur === v ? 'border-accent bg-accent/10 text-ink' : 'border-ink/15 text-muted hover:border-accent/50'}`}>{children}</button>
}
export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="mb-8"><p className="mb-1 font-display text-sm uppercase tracking-widest">{label}</p>
    {hint && <p className="mb-3 text-xs text-muted">{hint}</p>}<div className="grid gap-3 sm:grid-cols-3">{children}</div></div>)
export const Num = ({ value, onChange, ph }: { value: number; onChange: (n: number) => void; ph: string }) => (
  <input type="number" step="0.1" value={value || ''} placeholder={ph} onChange={(e) => onChange(Number(e.target.value))}
    className="rounded-xl border border-ink/15 bg-surface px-4 py-3 text-ink outline-none focus:border-accent" />)

export default function MouseFinder() {
  const [p, setP] = useState<Profile>(init)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const up = (x: Partial<Profile>) => setP((o) => ({ ...o, ...x }))
  const valid = [p.handLenCm >= 12 && p.handLenCm <= 26 && p.handWidCm >= 6 && p.handWidCm <= 14, true, true, p.budget > 0][step]
  const stored = (): Mouse[] => { try { return JSON.parse(localStorage.getItem('voltrix-mice') || '[]') } catch { return [] } }
  const [extra, setExtra] = useState<Mouse[]>(stored)
  const catalog = [...CATALOG, ...extra.filter((e) => !CATALOG.some((c) => c.id === e.id))]

  if (done) return <Results p={p} ranked={rank(catalog, p)} onEdit={() => setDone(false)} onImport={(m) => {
    setExtra(m); try { localStorage.setItem('voltrix-mice', JSON.stringify(m)) } catch {} }} hasData={catalog.length > 0} />

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 md:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-accent">Gaming Mouse Finder</p>
      <h1 className="mb-8 font-display text-3xl font-black md:text-5xl">Fit, budget, taste.</h1>
      <div className="mb-10 flex gap-2">{STEPS.map((s, i) => (
        <div key={s} className="flex-1"><div className="h-1 overflow-hidden rounded bg-ink/10"><motion.div className="h-full bg-accent" animate={{ width: i <= step ? '100%' : '0%' }} transition={{ ease, duration: 0.6 }} /></div>
          <p className={`mt-2 text-[10px] uppercase tracking-widest ${i === step ? 'text-accent' : 'text-muted'}`}>{s}</p></div>))}</div>
      <AnimatePresence mode="wait">
        <motion.section key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease }}>
          {step === 0 && <>
            <Field label="Hand length (cm)" hint="Wrist crease to the tip of your middle finger, hand flat."><Num ph="e.g. 18.5" value={p.handLenCm} onChange={(n) => up({ handLenCm: n })} /></Field>
            <Field label="Hand width (cm)" hint="Across the knuckles, excluding the thumb."><Num ph="e.g. 8.5" value={p.handWidCm} onChange={(n) => up({ handWidCm: n })} /></Field>
            <Field label="Dominant hand">{(['right', 'left'] as const).map((h) => <Opt key={h} v={h} cur={p.hand} set={(v) => up({ hand: v })}>{h}</Opt>)}</Field>
            {!valid && <p className="text-xs text-muted">Enter length 12–26 cm and width 6–14 cm to continue.</p>}</>}
          {step === 1 && <>
            <Field label="Grip">{(['palm', 'claw', 'fingertip'] as Grip[]).map((g) => <Opt key={g} v={g} cur={p.grip} set={(v) => up({ grip: v, variation: VARIATIONS[v][0].id })}>{g}</Opt>)}</Field>
            <Field label="Grip variation">{VARIATIONS[p.grip].map((v) => <Opt key={v.id} v={v.id} cur={p.variation} set={(x) => up({ variation: x })}>{v.label}</Opt>)}</Field>
            <Field label="How often do you lift the mouse?">{(['rarely', 'sometimes', 'often'] as const).map((l) => <Opt key={l} v={l} cur={p.lift} set={(v) => up({ lift: v })}>{l}</Opt>)}</Field></>}
          {step === 2 && <>
            <Field label="Shape">{(['any', 'symmetrical', 'ergonomic'] as const).map((s) => <Opt key={s} v={s} cur={p.shapePref} set={(v) => up({ shapePref: v })}>{s}</Opt>)}</Field>
            <Field label="Weight">{(['any', 'light', 'medium', 'heavy'] as const).map((s) => <Opt key={s} v={s} cur={p.weightPref} set={(v) => up({ weightPref: v })}>{s}</Opt>)}</Field>
            <Field label="Connection">{(['any', 'wireless', 'wired'] as const).map((s) => <Opt key={s} v={s} cur={p.connPref} set={(v) => up({ connPref: v })}>{s}</Opt>)}</Field></>}
          {step === 3 && <>
            <Field label="Maximum budget (USD)"><Num ph="100" value={p.budget} onChange={(n) => up({ budget: n })} /></Field>
            <p className="mb-3 font-display text-sm uppercase tracking-widest">Ranking priority</p>
            {(['ergo', 'budget', 'taste'] as const).map((k) => (
              <label key={k} className="mb-4 flex items-center gap-4 text-sm"><span className="w-24 capitalize text-muted">{k === 'ergo' ? 'Ergonomics' : k}</span>
                <input type="range" min={0} max={100} value={p.priority[k]} onChange={(e) => up({ priority: { ...p.priority, [k]: Number(e.target.value) } })} className="flex-1 accent-[rgb(var(--accent))]" />
                <span className="w-8 text-right">{p.priority[k]}</span></label>))}</>}
        </motion.section>
      </AnimatePresence>
      <div className="mt-10 flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-full px-6 py-3 text-sm uppercase tracking-widest text-muted disabled:opacity-30">Back</button>
        <button disabled={!valid} onClick={() => (step < 3 ? setStep(step + 1) : (setDone(true), (() => { try { localStorage.setItem('voltrix-ans-mouse', JSON.stringify(p)) } catch {} })()))}
          className="rounded-full border border-accent bg-accent/10 px-8 py-3 text-sm uppercase tracking-widest text-accent transition hover:shadow-[0_0_30px_rgb(var(--accent)/0.4)] disabled:opacity-30">{step < 3 ? 'Next' : 'See results'}</button>
      </div>
    </main>
  )
}
