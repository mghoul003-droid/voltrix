import type { ReactNode } from 'react'
import { CATALOG } from '@/data/mice'
import { useFavorites } from '@/lib/favorites'
import { Heart, Photo } from './Database'

const NA = <span className="text-muted/70">Not available</span>
export default function MouseDetail({ id }: { id: string }) {
  const m = CATALOG.find((x) => x.id === id); const { favs, toggle } = useFavorites()
  if (!m) return <main className="mx-auto max-w-3xl px-5 pt-32"><p>Mouse not found. <a className="text-accent underline" href="#/mice">Back to database</a></p></main>
  const rows: [string, ReactNode][] = [['Length', `${m.lengthMm} mm`], ['Width', `${m.widthMm} mm`], ['Height', `${m.heightMm} mm`], ['Weight', `${m.weightG} g`],
    ['Shape', m.shape], ['Hump position', NA], ['Connectivity', m.connectivity], ['Sensor', m.sensor ?? NA], ['Max polling rate', m.pollingHz ? `${m.pollingHz} Hz` : NA],
    ['Buttons', m.buttons ?? NA], ['Price (USD)', m.priceUsd != null ? `$${m.priceUsd}` : NA], ['Last verified', m.verifiedOn ?? NA]]
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-24 pt-28 md:px-8">
      <a href="#/mice" className="text-xs uppercase tracking-widest text-accent">← All mice</a>
      <div className="mb-8 mt-4 flex items-start justify-between"><div><p className="text-xs uppercase tracking-widest text-muted">{m.brand}</p><h1 className="font-display text-3xl font-black md:text-5xl">{m.name}</h1></div>
        <Heart on={favs.includes(m.id)} onClick={() => toggle(m.id)} /></div>
      <div className="grid gap-8 md:grid-cols-2">
        <Photo m={m} className="h-72 rounded-2xl border border-ink/10 bg-surface/60" />
        <table className="w-full text-sm"><tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-ink/10"><td className="py-2 text-muted">{k}</td><td className="py-2 text-right">{v}</td></tr>)}</tbody></table>
      </div>
      {m.priceNote && <p className="mt-6 text-xs text-muted">Price: {m.priceNote}</p>}
      {m.imageUrl && <p className="mt-2 text-xs text-muted">Photo: manufacturer product image, hot-linked from its source page; rights remain with the manufacturer.</p>}
      {m.notes && <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-muted">{m.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
      <h2 className="mb-3 mt-10 font-display text-sm uppercase tracking-widest">Sources</h2>
      <ul className="space-y-1 text-sm">{(m.sources ?? [{ label: 'Source', url: m.sourceUrl }]).map((s) => <li key={s.url}><a className="text-accent underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
      <p className="mt-10 text-xs text-muted">Values can change between regions and revisions. Check the manufacturer before buying.</p>
    </main>)
}
