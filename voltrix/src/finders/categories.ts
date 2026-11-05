// Category definitions: questionnaire, technical filters, spec columns and scoring.
// All thresholds are tunable heuristics (not published standards). Scoring never
// guesses: a missing spec yields an "unscored" part that is left out of the average.
export type Specs = Record<string, any>
export type Ans = Record<string, any>
export interface Product { id: string; brand: string; name: string; priceUsd?: number; sourceUrl: string; verifiedOn?: string; imageUrl?: string; notes?: string[]; specs: Specs }
export interface Part { label: string; score: number | null; note: string }
export interface Scored { parts: Part[]; tasteParts: Part[]; blocked?: string }
export interface Q { id: string; label: string; hint?: string; kind: 'choice' | 'number'; options?: string[]; unit?: string; min?: number; max?: number; def: string | number }
export interface Col { key: string; label: string; type: 'num' | 'str' | 'bool'; unit?: string }
export interface Flt { key: string; label: string; kind: 'select' | 'max' | 'min'; options?: string[] }
export interface Category { id: string; title: string; blurb: string; steps: { title: string; qs: Q[] }[]; cols: Col[]; filters: Flt[]; score: (s: Specs, a: Ans) => Scored }

export const clamp = (x: number) => Math.max(0, Math.min(1, x))
const band = (x: number, lo: number, hi: number, tol: number) => (x < lo ? clamp(1 - (lo - x) / tol) : x > hi ? clamp(1 - (x - hi) / tol) : 1)
const P = (label: string, score: number | null, note: string): Part => ({ label, score, note })
const U = (label: string): Part => P(label, null, `${label} not recorded for this product, so it is not scored.`)
const has = (v: any) => v !== undefined && v !== null
const ch = (id: string, label: string, options: string[], def: string, hint?: string): Q => ({ id, label, kind: 'choice', options, def, hint })
const nm = (id: string, label: string, unit: string, min: number, max: number, def: number, hint?: string): Q => ({ id, label, kind: 'number', unit, min, max, def, hint })

const ORDER = ['60%', '65%', '75%', 'TKL', 'full']
const keyboard: Category = {
  id: 'keyboard', title: 'Keyboard Finder', blurb: 'Layout, switch feel and competitive features matched to your desk and games.',
  steps: [
    { title: 'Play', qs: [ch('use', 'Main use', ['competitive-fps', 'mmo-many-binds', 'mixed-work-play'], 'mixed-work-play'), ch('space', 'Desk space for the keyboard', ['small', 'medium', 'large'], 'medium', 'Small leaves room for wide mouse swings.')] },
    { title: 'Feel', qs: [ch('feel', 'Switch feel', ['linear', 'tactile', 'clicky', 'any'], 'any'), ch('rt', 'Rapid trigger wanted?', ['yes', 'no'], 'no'), ch('wireless', 'Wireless', ['required', 'any'], 'any'), ch('hotswap', 'Hot-swappable switches', ['yes', 'any'], 'any')] },
  ],
  cols: [{ key: 'layout', label: 'Layout', type: 'str' }, { key: 'switchType', label: 'Switch type', type: 'str' }, { key: 'actuationMm', label: 'Actuation', type: 'num', unit: 'mm' }, { key: 'rapidTrigger', label: 'Rapid trigger', type: 'bool' }, { key: 'hotSwap', label: 'Hot-swap', type: 'bool' }, { key: 'wireless', label: 'Wireless', type: 'bool' }, { key: 'pollingHz', label: 'Max polling', type: 'num', unit: 'Hz' }],
  filters: [{ key: 'layout', label: 'Layout', kind: 'select', options: ORDER }, { key: 'switchType', label: 'Switch', kind: 'select', options: ['linear', 'tactile', 'clicky', 'magnetic', 'optical'] }, { key: 'wireless', label: 'Wireless', kind: 'select', options: ['true', 'false'] }, { key: 'actuationMm', label: 'Max actuation (mm)', kind: 'max' }],
  score: (s, a) => {
    const parts: Part[] = [], t: Part[] = []; let blocked
    const ideal: string[] = a.use === 'mmo-many-binds' ? (a.space === 'small' ? ['75%', 'TKL'] : ['TKL', 'full']) : ({ small: ['60%', '65%'], medium: ['65%', '75%', 'TKL'], large: ['TKL', 'full'] } as any)[a.space]
    const li = ORDER.indexOf(s.layout)
    parts.push(li < 0 ? U('Layout') : P('Layout', clamp(1 - 0.5 * Math.min(...ideal.map((x) => Math.abs(ORDER.indexOf(x) - li)))), `${s.layout} vs ideal ${ideal.join('/')} for a ${a.space} desk and ${a.use}.`))
    if (a.rt === 'yes') parts.push(has(s.rapidTrigger) ? P('Rapid trigger', s.rapidTrigger ? 1 : 0, s.rapidTrigger ? 'Has rapid trigger.' : 'No rapid trigger.') : U('Rapid trigger'))
    if (a.use === 'competitive-fps') parts.push(has(s.pollingHz) ? P('Polling rate', s.pollingHz >= 1000 ? 1 : 0.5, `${s.pollingHz} Hz max; 1000 Hz or more preferred for competitive play.`) : U('Polling rate'))
    if (a.wireless === 'required') { if (s.wireless === false) blocked = 'You require wireless; this keyboard is wired.'; else if (!has(s.wireless)) parts.push(U('Wireless')) }
    if (a.feel !== 'any') t.push(has(s.switchType) ? P('Switch feel', s.switchType === a.feel ? 1 : 0, `${s.switchType} vs preferred ${a.feel}.`) : U('Switch feel'))
    if (a.hotswap === 'yes') t.push(has(s.hotSwap) ? P('Hot-swap', s.hotSwap ? 1 : 0, s.hotSwap ? 'Hot-swappable.' : 'Not hot-swappable.') : U('Hot-swap'))
    return { parts, tasteParts: t, blocked }
  },
}
const mousepad: Category = {
  id: 'mousepad', title: 'Mousepad Finder', blurb: 'Size from your real arm travel, surface from how you play.',
  steps: [
    { title: 'Movement', qs: [nm('travel', 'Mouse travel for a 180° turn', 'cm', 3, 60, 20, 'Measure on your current pad at your in-game sensitivity.'), nm('deskMax', 'Widest pad your desk allows', 'cm', 20, 140, 90)] },
    { title: 'Surface', qs: [ch('surface', 'Surface character', ['speed', 'control', 'balanced', 'any'], 'any'), ch('wrist', 'Rest wrist or forearm on the pad?', ['yes', 'no'], 'no')] },
  ],
  cols: [{ key: 'widthMm', label: 'Width', type: 'num', unit: 'mm' }, { key: 'depthMm', label: 'Depth', type: 'num', unit: 'mm' }, { key: 'thicknessMm', label: 'Thickness', type: 'num', unit: 'mm' }, { key: 'surface', label: 'Surface', type: 'str' }, { key: 'stitched', label: 'Stitched edges', type: 'bool' }],
  filters: [{ key: 'surface', label: 'Surface', kind: 'select', options: ['speed', 'control', 'balanced', 'hard', 'glass'] }, { key: 'widthMm', label: 'Min width (mm)', kind: 'min' }, { key: 'thicknessMm', label: 'Max thickness (mm)', kind: 'max' }],
  score: (s, a) => {
    const parts: Part[] = [], t: Part[] = []; let blocked
    const need = a.travel * 10 * 1.5, needD = need * 0.4
    parts.push(has(s.widthMm) ? P('Width', clamp(1 - Math.max(0, need - s.widthMm) / (need * 0.4)), `${s.widthMm} mm vs ≥ ${Math.round(need)} mm for ${a.travel} cm of travel (1.5× margin).`) : U('Width'))
    parts.push(has(s.depthMm) ? P('Depth', clamp(1 - Math.max(0, needD - s.depthMm) / (needD * 0.5)), `${s.depthMm} mm vs ≥ ${Math.round(needD)} mm suggested.`) : U('Depth'))
    if (has(s.widthMm) && s.widthMm > a.deskMax * 10) blocked = `${s.widthMm} mm is wider than your ${a.deskMax} cm limit.`
    if (a.wrist === 'yes') parts.push(has(s.thicknessMm) ? P('Thickness', clamp(s.thicknessMm / 3), `${s.thicknessMm} mm; 3 mm or more suggested for wrist rest.`) : U('Thickness'))
    if (a.surface !== 'any') t.push(has(s.surface) ? P('Surface', s.surface === a.surface ? 1 : 0, `${s.surface} vs preferred ${a.surface}.`) : U('Surface'))
    return { parts, tasteParts: t, blocked }
  },
}
const LIM: Record<string, number> = { 'phone-3.5mm': 32, 'phone-usbc': 32, 'console-controller': 32, 'pc-jack': 64, 'usb-dac': 300 }
const iem: Category = {
  id: 'iem', title: 'IEM Finder', blurb: 'Source compatibility and sound preference for in-ear monitors.',
  steps: [
    { title: 'Source', qs: [ch('source', 'What will drive them?', Object.keys(LIM), 'pc-jack'), ch('mic', 'Need an inline mic?', ['yes', 'no'], 'no')] },
    { title: 'Sound', qs: [ch('tuning', 'Tuning preference', ['neutral', 'warm', 'bright', 'any'], 'any'), ch('driver', 'Driver type', ['dynamic', 'hybrid', 'planar', 'any'], 'any')] },
  ],
  cols: [{ key: 'driverType', label: 'Driver type', type: 'str' }, { key: 'impedanceOhm', label: 'Impedance', type: 'num', unit: 'Ω' }, { key: 'connector', label: 'Connector', type: 'str' }, { key: 'mic', label: 'Mic', type: 'bool' }, { key: 'tuning', label: 'Tuning', type: 'str' }],
  filters: [{ key: 'driverType', label: 'Driver', kind: 'select', options: ['dynamic', 'hybrid', 'planar', 'BA'] }, { key: 'connector', label: 'Connector', kind: 'select', options: ['3.5mm', 'usb-c', 'both'] }, { key: 'impedanceOhm', label: 'Max impedance (Ω)', kind: 'max' }, { key: 'mic', label: 'Mic', kind: 'select', options: ['true', 'false'] }],
  score: (s, a) => {
    const parts: Part[] = [], t: Part[] = []; let blocked
    const usbc = a.source === 'phone-usbc'
    if (!has(s.connector)) parts.push(U('Connector'))
    else if (usbc) parts.push(P('Connector', s.connector === 'usb-c' || s.connector === 'both' ? 1 : 0.5, s.connector === '3.5mm' ? 'USB-C phone needs an adapter.' : 'Direct USB-C connection.'))
    else if (s.connector === 'usb-c') blocked = 'USB-C only; your source uses a 3.5mm jack.'
    else parts.push(P('Connector', 1, '3.5mm compatible.'))
    const lim = LIM[a.source]
    parts.push(has(s.impedanceOhm) ? P('Power match', clamp(1 - Math.max(0, s.impedanceOhm - lim) / lim), `${s.impedanceOhm} Ω vs ≤ ${lim} Ω comfortable for ${a.source}.`) : U('Power match'))
    if (a.mic === 'yes') parts.push(has(s.mic) ? P('Mic', s.mic ? 1 : 0, s.mic ? 'Has mic.' : 'No mic.') : U('Mic'))
    if (a.tuning !== 'any') t.push(has(s.tuning) ? P('Tuning', s.tuning === a.tuning ? 1 : 0, `${s.tuning} vs preferred ${a.tuning}.`) : U('Tuning'))
    if (a.driver !== 'any') t.push(has(s.driverType) ? P('Driver', s.driverType === a.driver ? 1 : 0, `${s.driverType} vs preferred ${a.driver}.`) : U('Driver'))
    return { parts, tasteParts: t, blocked }
  },
}
const headphone: Category = {
  id: 'headphone', title: 'Headphone Finder', blurb: 'Isolation, comfort over long sessions and power needs.',
  steps: [
    { title: 'Environment', qs: [ch('room', 'Where do you play?', ['quiet', 'shared-or-noisy'], 'quiet', 'Open-back leaks sound both ways.'), nm('hours', 'Hours per session', 'h', 1, 12, 3)] },
    { title: 'Setup', qs: [ch('mic', 'Need a mic?', ['yes', 'no'], 'yes'), ch('amp', 'Dedicated amp/DAC?', ['yes', 'no'], 'no'), ch('wireless', 'Wireless', ['required', 'any'], 'any'), ch('type', 'Type preference', ['open-back', 'closed-back', 'any'], 'any')] },
  ],
  cols: [{ key: 'type', label: 'Type', type: 'str' }, { key: 'connection', label: 'Connection', type: 'str' }, { key: 'mic', label: 'Mic', type: 'bool' }, { key: 'impedanceOhm', label: 'Impedance', type: 'num', unit: 'Ω' }, { key: 'weightG', label: 'Weight', type: 'num', unit: 'g' }],
  filters: [{ key: 'type', label: 'Type', kind: 'select', options: ['open-back', 'closed-back'] }, { key: 'connection', label: 'Connection', kind: 'select', options: ['wired', 'wireless', 'both'] }, { key: 'weightG', label: 'Max weight (g)', kind: 'max' }, { key: 'mic', label: 'Mic', kind: 'select', options: ['true', 'false'] }],
  score: (s, a) => {
    const parts: Part[] = [], t: Part[] = []; let blocked
    if (a.room === 'shared-or-noisy') parts.push(has(s.type) ? P('Isolation', s.type === 'closed-back' ? 1 : 0, `${s.type} in a shared or noisy room.`) : U('Isolation'))
    if (a.hours >= 4) parts.push(has(s.weightG) ? P('Comfort', clamp(1 - Math.max(0, s.weightG - 300) / 150), `${s.weightG} g for ${a.hours} h sessions; ≤ 300 g suggested.`) : U('Comfort'))
    if (a.mic === 'yes') parts.push(has(s.mic) ? P('Mic', s.mic ? 1 : 0, s.mic ? 'Has mic.' : 'No mic.') : U('Mic'))
    if (a.wireless === 'required') { if (s.connection === 'wired') blocked = 'You require wireless; this model is wired.'; else if (!has(s.connection)) parts.push(U('Connection')) }
    if (a.amp === 'no') parts.push(has(s.impedanceOhm) ? P('Power match', clamp(1 - Math.max(0, s.impedanceOhm - 80) / 120), `${s.impedanceOhm} Ω without an amp; ≤ 80 Ω suggested.`) : U('Power match'))
    if (a.type !== 'any') t.push(has(s.type) ? P('Type', s.type === a.type ? 1 : 0, `${s.type} vs preferred ${a.type}.`) : U('Type'))
    return { parts, tasteParts: t, blocked }
  },
}
const FOV: Record<string, number[]> = { competitive: [25, 40], cinematic: [40, 60], mixed: [30, 50] }
const monitor: Category = {
  id: 'monitor', title: 'Monitor Finder', blurb: 'Refresh vs your frame rate, sharpness and field of view at your actual distance.',
  steps: [
    { title: 'System', qs: [nm('fps', 'Typical frame rate in your main game', 'fps', 30, 600, 144), nm('dist', 'Viewing distance', 'cm', 30, 150, 70)] },
    { title: 'Use', qs: [ch('genre', 'Play style', ['competitive', 'cinematic', 'mixed'], 'mixed'), ch('res', 'Resolution preference', ['1080p', '1440p', '4K', 'any'], 'any'), ch('panel', 'Panel preference', ['IPS', 'VA', 'OLED', 'any'], 'any')] },
  ],
  cols: [{ key: 'sizeIn', label: 'Size', type: 'num', unit: 'in' }, { key: 'resW', label: 'Width px', type: 'num' }, { key: 'resH', label: 'Height px', type: 'num' }, { key: 'refreshHz', label: 'Refresh', type: 'num', unit: 'Hz' }, { key: 'panel', label: 'Panel', type: 'str' }, { key: 'adaptiveSync', label: 'Adaptive sync', type: 'bool' }],
  filters: [{ key: 'panel', label: 'Panel', kind: 'select', options: ['IPS', 'VA', 'OLED', 'TN'] }, { key: 'refreshHz', label: 'Min refresh (Hz)', kind: 'min' }, { key: 'sizeIn', label: 'Max size (in)', kind: 'max' }, { key: 'adaptiveSync', label: 'Adaptive sync', kind: 'select', options: ['true', 'false'] }],
  score: (s, a) => {
    const parts: Part[] = [], t: Part[] = []
    if (has(s.refreshHz)) { const r = s.refreshHz / a.fps; parts.push(P('Refresh', r < 0.9 ? clamp(r / 0.9) : r > 2 ? clamp(1 - (r - 2) / 2) : 1, `${s.refreshHz} Hz vs ~${a.fps} fps (${r.toFixed(1)}×); 0.9–2× is the sweet spot.`)) } else parts.push(U('Refresh'))
    if (has(s.sizeIn) && has(s.resW) && has(s.resH)) {
      const d = Math.hypot(s.resW, s.resH), ppd = (d / s.sizeIn) * (a.dist / 2.54) * (Math.PI / 180)
      const fov = 2 * Math.atan((s.sizeIn * s.resW / d) / 2 / (a.dist / 2.54)) * 180 / Math.PI, [lo, hi] = FOV[a.genre]
      parts.push(P('Sharpness', band(ppd, 40, 70, 20), `${ppd.toFixed(0)} pixels per degree at ${a.dist} cm; 40–70 suggested.`))
      parts.push(P('Field of view', band(fov, lo, hi, 12), `${fov.toFixed(0)}° horizontal; ${lo}–${hi}° suggested for ${a.genre}.`))
    } else { parts.push(U('Sharpness')); parts.push(U('Field of view')) }
    if (a.res !== 'any') t.push(has(s.resH) ? P('Resolution', s.resH === ({ '1080p': 1080, '1440p': 1440, '4K': 2160 } as any)[a.res] ? 1 : 0, `${s.resW}×${s.resH} vs ${a.res}.`) : U('Resolution'))
    if (a.panel !== 'any') t.push(has(s.panel) ? P('Panel', String(s.panel).includes(a.panel) ? 1 : 0, `${s.panel} vs preferred ${a.panel}.`) : U('Panel'))
    return { parts, tasteParts: t }
  },
}
export const CATEGORIES: Record<string, Category> = { keyboard, mousepad, iem, headphone, monitor }

export function parseCsv(cat: Category, text: string): { items: Product[]; errors: string[] } {
  const rows = text.trim().split(/\r?\n/).filter(Boolean), items: Product[] = [], errors: string[] = []
  if (rows.length < 2) return { items, errors: ['Add a header row and at least one data row.'] }
  const h = rows[0].split(',').map((x) => x.trim())
  rows.slice(1).forEach((r, i) => {
    const c = r.split(',').map((x) => x.trim()), g = (k: string) => c[h.indexOf(k)] ?? '', line = i + 2
    if (!g('brand') || !g('name')) return errors.push(`Line ${line}: brand and name required.`)
    if (!/^https?:\/\//.test(g('source_url'))) return errors.push(`Line ${line}: source_url is required.`)
    const specs: Specs = {}; let bad = ''
    cat.cols.forEach((k) => { const v = g(k.key); if (v === '') return; if (k.type === 'num') { if (isNaN(Number(v))) bad = k.key; else specs[k.key] = Number(v) } else if (k.type === 'bool') specs[k.key] = v === 'true'; else specs[k.key] = v })
    if (bad) return errors.push(`Line ${line}: ${bad} must be a number.`)
    items.push({ id: `${g('brand')}-${g('name')}`.toLowerCase().replace(/\W+/g, '-'), brand: g('brand'), name: g('name'), priceUsd: g('price_usd') ? Number(g('price_usd')) : undefined, sourceUrl: g('source_url'), verifiedOn: g('verified_on') || undefined, specs })
  })
  return { items, errors }
}
export const csvHeader = (c: Category) => ['brand', 'name', 'price_usd', 'source_url', 'verified_on', ...c.cols.map((k) => k.key)].join(',')
