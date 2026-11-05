// VOLTRIX mouse recommendation engine. Pure functions, no I/O.
// All fit thresholds live in CFG: they are starting heuristics (not published
// standards) and are meant to be tuned. Product data is never invented here.
export type Grip = 'palm' | 'claw' | 'fingertip'
export type Hump = 'front' | 'center' | 'rear'
export type Shape = 'symmetrical' | 'ergonomic-right' | 'ergonomic-left'
export type Conn = 'wireless' | 'wired' | 'both'

export interface Mouse {
  id: string; brand: string; name: string
  lengthMm: number; widthMm: number; heightMm: number; weightG: number
  shape: Shape; hump?: Hump; priceUsd?: number; connectivity: Conn
  sourceUrl: string // required: primary page the specs were verified from
  sensor?: string; pollingHz?: number; buttons?: number; imageUrl?: string
  verifiedOn?: string; sources?: { label: string; url: string }[]; priceNote?: string; notes?: string[]
}
export interface Profile {
  handLenCm: number; handWidCm: number; hand: 'right' | 'left'
  grip: Grip; variation: string; lift: 'rarely' | 'sometimes' | 'often'
  shapePref: 'any' | 'symmetrical' | 'ergonomic'
  weightPref: 'any' | 'light' | 'medium' | 'heavy'
  connPref: 'any' | 'wireless' | 'wired'
  budget: number
  priority: { ergo: number; budget: number; taste: number }
}

export const VARIATIONS: Record<Grip, { id: string; label: string; m: number }[]> = {
  palm: [{ id: 'full', label: 'Full palm: hand flat, wrist supported', m: 1 }, { id: 'relaxed', label: 'Relaxed palm: fingers slightly curved', m: 0.97 }],
  claw: [{ id: 'relaxed', label: 'Relaxed claw', m: 1 }, { id: 'aggressive', label: 'Aggressive claw: high finger arch', m: 0.96 }],
  fingertip: [{ id: 'standard', label: 'Fingertip', m: 1 }, { id: 'hybrid', label: 'Fingertip-claw hybrid', m: 1.03 }],
}
export const CFG = {
  lenRatio: { palm: 0.64, claw: 0.6, fingertip: 0.56 } as Record<Grip, number>, lenTol: 0.12,
  widthRatio: 0.6, widthTol: 0.12,
  heightBand: { palm: [0.2, 0.25], claw: [0.18, 0.23], fingertip: [0.15, 0.21] } as Record<Grip, number[]>, heightTol: 0.07,
  hump: { palm: { center: 1, rear: 0.8, front: 0.4 }, claw: { rear: 1, center: 0.6, front: 0.3 }, fingertip: { center: 1, front: 0.8, rear: 0.5 } } as Record<Grip, Record<Hump, number>>,
  liftLimit: { rarely: Infinity, sometimes: 90, often: 70 }, liftFall: 40,
  weightBand: { light: [0, 65], medium: [65, 85], heavy: [85, 999] } as Record<string, number[]>, weightFall: 15,
  w: { length: 0.35, width: 0.3, height: 0.15, hump: 0.1, weight: 0.1 },
}
export interface Part { key: string; label: string; score: number; note: string }
export interface Result {
  mouse: Mouse; ergo: number; budget: number; taste: number; overall: number
  ergoParts: Part[]; budgetNote: string; tasteParts: Part[]; blocked?: string
  ideal: { lengthMm: number; widthMm: number; heightMin: number; heightMax: number }
}
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const band = (x: number, lo: number, hi: number, tol: number) => (x < lo ? clamp(1 - (lo - x) / tol) : x > hi ? clamp(1 - (x - hi) / tol) : 1)
const pct = (x: number) => Math.round(x * 100)

export function evaluate(m: Mouse, p: Profile): Result {
  const L = p.handLenCm * 10, W = p.handWidCm * 10
  const vm = VARIATIONS[p.grip].find((v) => v.id === p.variation)?.m ?? 1
  const tLen = CFG.lenRatio[p.grip] * vm, [hLo, hHi] = CFG.heightBand[p.grip]
  const lr = m.lengthMm / L, wr = m.widthMm / W, hr = m.heightMm / L
  const parts: (Part & { w: number })[] = [
    { key: 'length', label: 'Length', w: CFG.w.length, score: band(lr, tLen, tLen, CFG.lenTol),
      note: `${m.lengthMm} mm is ${(lr * 100).toFixed(1)}% of your hand length; target ≈ ${(tLen * 100).toFixed(0)}% for ${p.grip} (${p.variation}).` },
    { key: 'width', label: 'Width', w: CFG.w.width, score: band(wr, CFG.widthRatio, CFG.widthRatio, CFG.widthTol),
      note: `${m.widthMm} mm is ${(wr * 100).toFixed(1)}% of your hand width; target ≈ ${CFG.widthRatio * 100}%.` },
    { key: 'height', label: 'Height', w: CFG.w.height, score: band(hr, hLo, hHi, CFG.heightTol),
      note: `${m.heightMm} mm is ${(hr * 100).toFixed(1)}% of hand length; ${p.grip} target ${pct(hLo)}–${pct(hHi)}%.` },
    { key: 'weight', label: 'Weight', w: CFG.w.weight, score: clamp(1 - (m.weightG - CFG.liftLimit[p.lift]) / CFG.liftFall),
      note: `${m.weightG} g with ${p.lift} lifting${p.lift === 'rarely' ? ' (weight not penalised)' : `; comfort limit ≈ ${CFG.liftLimit[p.lift]} g`}.` },
  ]
  if (m.hump) parts.push({ key: 'hump', label: 'Hump position', w: CFG.w.hump, score: CFG.hump[p.grip][m.hump],
    note: `${m.hump} hump for ${p.grip} grip.` })
  else parts.push({ key: 'hump', label: 'Hump position', w: 0, score: 0, note: 'Hump position not recorded for this mouse, so it is excluded rather than guessed.' })
  const tw = parts.reduce((s, x) => s + x.w, 0)
  let ergo = parts.reduce((s, x) => s + x.score * x.w, 0) / tw
  let blocked: string | undefined
  if ((p.hand === 'left' && m.shape === 'ergonomic-right') || (p.hand === 'right' && m.shape === 'ergonomic-left')) {
    blocked = `Shaped for the ${m.shape === 'ergonomic-right' ? 'right' : 'left'} hand; you selected ${p.hand}.`; ergo = 0
  }
  const hasPrice = m.priceUsd != null
  const over = (m.priceUsd ?? 0) - p.budget
  const budget = hasPrice ? clamp(1 - Math.max(0, over) / (p.budget * 0.5)) : 0
  const budgetNote = !hasPrice ? 'No USD price on file, so budget fit is unscored and left out of the overall rank.' : over <= 0 ? `$${m.priceUsd} is within your $${p.budget} budget.` : `$${m.priceUsd} is $${over.toFixed(0)} over your $${p.budget} budget.`
  const taste: Part[] = []
  if (p.shapePref !== 'any') { const ok = p.shapePref === 'symmetrical' ? m.shape === 'symmetrical' : m.shape !== 'symmetrical'
    taste.push({ key: 'shape', label: 'Shape', score: ok ? 1 : 0, note: `${m.shape} ${ok ? 'matches' : 'differs from'} your ${p.shapePref} preference.` }) }
  if (p.weightPref !== 'any') { const [lo, hi] = CFG.weightBand[p.weightPref]
    taste.push({ key: 'weight', label: 'Weight', score: band(m.weightG, lo, hi, CFG.weightFall), note: `${m.weightG} g vs preferred ${p.weightPref} (${lo}–${hi === 999 ? '∞' : hi} g).` }) }
  if (p.connPref !== 'any') { const ok = m.connectivity === 'both' || m.connectivity === p.connPref
    taste.push({ key: 'conn', label: 'Connection', score: ok ? 1 : 0, note: `${m.connectivity} ${ok ? 'covers' : 'does not cover'} your ${p.connPref} preference.` }) }
  const tasteS = taste.length ? taste.reduce((s, x) => s + x.score, 0) / taste.length : 1
  const pr = p.priority, pb = hasPrice ? pr.budget : 0, ps = pr.ergo + pb + pr.taste || 1
  const overall = (ergo * pr.ergo + budget * pb + tasteS * pr.taste) / ps
  return { mouse: m, ergo: pct(ergo), budget: pct(budget), taste: pct(tasteS), overall: pct(overall),
    ergoParts: parts.map(({ w, ...r }) => r), budgetNote, tasteParts: taste, blocked,
    ideal: { lengthMm: Math.round(tLen * L), widthMm: Math.round(CFG.widthRatio * W), heightMin: Math.round(hLo * L), heightMax: Math.round(hHi * L) } }
}
export const rank = (c: Mouse[], p: Profile) => c.map((m) => evaluate(m, p)).sort((a, b) => b.overall - a.overall)

// CSV import: brand,name,length_mm,width_mm,height_mm,weight_g,shape,hump,price_usd,connectivity,source_url
export function parseCsv(text: string): { mice: Mouse[]; errors: string[] } {
  const rows = text.trim().split(/\r?\n/).filter(Boolean); const errors: string[] = []; const mice: Mouse[] = []
  if (rows.length < 2) return { mice, errors: ['Add a header row and at least one data row.'] }
  const h = rows[0].split(',').map((x) => x.trim().toLowerCase())
  rows.slice(1).forEach((r, i) => {
    const c = r.split(',').map((x) => x.trim()); const g = (k: string) => c[h.indexOf(k)] ?? ''
    const n = (k: string) => Number(g(k)); const line = i + 2
    const shape = g('shape') as Shape, conn = g('connectivity') as Conn, hump = g('hump') as Hump | ''
    if (!g('brand') || !g('name')) return errors.push(`Line ${line}: brand and name required.`)
    if (![n('length_mm'), n('width_mm'), n('height_mm'), n('weight_g'), n('price_usd')].every((v) => v > 0)) return errors.push(`Line ${line}: numeric dimensions, weight and price must be > 0.`)
    if (!['symmetrical', 'ergonomic-right', 'ergonomic-left'].includes(shape)) return errors.push(`Line ${line}: shape must be symmetrical, ergonomic-right or ergonomic-left.`)
    if (!['wireless', 'wired', 'both'].includes(conn)) return errors.push(`Line ${line}: connectivity must be wireless, wired or both.`)
    if (hump && !['front', 'center', 'rear'].includes(hump)) return errors.push(`Line ${line}: hump must be front, center, rear or empty.`)
    if (!/^https?:\/\//.test(g('source_url'))) return errors.push(`Line ${line}: source_url (where specs were verified) is required.`)
    mice.push({ id: `${g('brand')}-${g('name')}`.toLowerCase().replace(/\W+/g, '-'), brand: g('brand'), name: g('name'), lengthMm: n('length_mm'), widthMm: n('width_mm'),
      heightMm: n('height_mm'), weightG: n('weight_g'), shape, hump: hump || undefined, priceUsd: n('price_usd'), connectivity: conn, sourceUrl: g('source_url') })
  })
  return { mice, errors }
}
