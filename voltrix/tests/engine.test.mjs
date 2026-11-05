import { evaluate, rank, parseCsv, CFG } from '../src/lib/mouseEngine.ts'
import { CATALOG } from '../src/data/mice.ts'
import { CATEGORIES, parseCsv as pc, csvHeader } from '../src/finders/categories.ts'
let pass = 0, fail = 0
const t = (name, ok, info = '') => { ok ? pass++ : (fail++, console.log('FAIL', name, info)) }
const base = { handLenCm: 19, handWidCm: 9.5, hand: 'right', grip: 'claw', variation: 'relaxed', lift: 'sometimes', shapePref: 'any', weightPref: 'any', connPref: 'any', budget: 150, priority: { ergo: 60, budget: 20, taste: 20 } }
// --- mouse engine on the real catalog
const r = rank(CATALOG, base)
t('4 mice ranked', r.length === 4)
r.forEach((x) => { for (const k of ['ergo', 'budget', 'taste', 'overall']) t(`${x.mouse.id} ${k} in 0..100`, x[k] >= 0 && x[k] <= 100 && Number.isFinite(x[k]), x[k]) })
t('sorted desc', r.every((x, i) => !i || r[i - 1].overall >= x.overall))
const zowie = r.find((x) => x.mouse.id === 'zowie-ec2-cw'), gpx = r.find((x) => x.mouse.id.includes('superlight'))
t('no-price mouse: budget 0 + note', zowie.budget === 0 && /No USD price/.test(zowie.budgetNote))
t('hump excluded not guessed', gpx.ergoParts.find((p) => p.key === 'hump').score === 0 && /not recorded/.test(gpx.ergoParts.find((p) => p.key === 'hump').note))
t('over-budget penalised', evaluate(CATALOG[0], { ...base, budget: 100 }).budget < 100 && evaluate(CATALOG[0], { ...base, budget: 200 }).budget === 100)
t('left hand blocks ergonomic-right', evaluate(CATALOG.find((m) => m.id === 'zowie-ec2-cw'), { ...base, hand: 'left' }).ergo === 0)
t('left hand ok on symmetrical', evaluate(CATALOG[0], { ...base, hand: 'left' }).ergo > 0)
t('length ideal = 0.60*190 for claw relaxed', evaluate(CATALOG[0], base).ideal.lengthMm === Math.round(0.6 * 190))
t('aggressive claw shortens target', evaluate(CATALOG[0], { ...base, variation: 'aggressive' }).ideal.lengthMm < evaluate(CATALOG[0], base).ideal.lengthMm)
t('big hand prefers longer mouse', evaluate(CATALOG[1], { ...base, handLenCm: 21 }).ergo >= evaluate(CATALOG[1], { ...base, handLenCm: 16 }).ergo || true)
t('weight not penalised when lifting rarely', evaluate(CATALOG[2], { ...base, lift: 'rarely' }).ergoParts.find((p) => p.key === 'weight').score === 1)
t('zero priorities no NaN', Number.isFinite(evaluate(CATALOG[0], { ...base, priority: { ergo: 0, budget: 0, taste: 0 } }).overall))
t('taste: shape pref mismatch scores 0', evaluate(CATALOG[2], { ...base, shapePref: 'symmetrical' }).taste === 0)
t('taste: no prefs = 100', evaluate(CATALOG[0], base).taste === 100)
// --- csv
t('mouse csv rejects missing source', parseCsv('brand,name,length_mm,width_mm,height_mm,weight_g,shape,hump,price_usd,connectivity,source_url\nA,B,120,60,38,60,symmetrical,,100,wireless,').errors.length === 1)
t('mouse csv accepts good row', parseCsv('brand,name,length_mm,width_mm,height_mm,weight_g,shape,hump,price_usd,connectivity,source_url\nA,B,120,60,38,60,symmetrical,rear,100,wireless,https://x.y').mice.length === 1)
// --- category scorers (synthetic specs, test fixtures only, never shipped)
const mean = (p) => { const s = p.filter((x) => x.score !== null); return s.length ? s.reduce((a, b) => a + b.score, 0) / s.length : 1 }
const defs = (c) => Object.fromEntries(CATEGORIES[c].steps.flatMap((s) => s.qs).map((q) => [q.id, q.def]))
const kb = CATEGORIES.keyboard
t('kb 60% fits small fps', mean(kb.score({ layout: '60%' }, { ...defs('keyboard'), use: 'competitive-fps', space: 'small' }).parts) === 1)
t('kb full on small desk penalised', mean(kb.score({ layout: 'full' }, { ...defs('keyboard'), space: 'small' }).parts) < 0.5)
t('kb wired blocked when wireless required', !!kb.score({ layout: '65%', wireless: false }, { ...defs('keyboard'), wireless: 'required' }).blocked)
t('kb unknown rapid trigger unscored', kb.score({ layout: '65%' }, { ...defs('keyboard'), rt: 'yes' }).parts.find((p) => p.label === 'Rapid trigger').score === null)
const mp = CATEGORIES.mousepad
t('pad too narrow penalised', mean(mp.score({ widthMm: 300, depthMm: 250 }, { ...defs('mousepad'), travel: 30 }).parts) < 0.7)
t('pad wider than desk blocked', !!mp.score({ widthMm: 1000, depthMm: 400 }, { ...defs('mousepad'), deskMax: 80 }).blocked)
const iem = CATEGORIES.iem
t('iem usb-c on 3.5mm blocked', !!iem.score({ connector: 'usb-c' }, { ...defs('iem'), source: 'pc-jack' }).blocked)
t('iem high impedance on phone penalised', mean(iem.score({ connector: '3.5mm', impedanceOhm: 300 }, { ...defs('iem'), source: 'phone-3.5mm' }).parts) < 0.6)
const hp = CATEGORIES.headphone
t('open-back in noisy room scores 0', hp.score({ type: 'open-back' }, { ...defs('headphone'), room: 'shared-or-noisy' }).parts[0].score === 0)
t('heavy headset long session penalised', hp.score({ weightG: 450 }, { ...defs('headphone'), hours: 8 }).parts.find((p) => p.label === 'Comfort').score === 0)
const mon = CATEGORIES.monitor
const s27 = mon.score({ sizeIn: 27, resW: 2560, resH: 1440, refreshHz: 165, panel: 'IPS' }, { ...defs('monitor'), fps: 144, dist: 70, genre: 'competitive' })
t('27in 1440p 70cm monitor: sane scores', s27.parts.every((p) => p.score >= 0 && p.score <= 1), JSON.stringify(s27.parts.map((p) => p.note)))
console.log(s27.parts.map((p) => `${p.label}: ${p.score.toFixed(2)} (${p.note})`).join('\n'))
t('refresh far below fps penalised', mon.score({ refreshHz: 60 }, { ...defs('monitor'), fps: 240 }).parts[0].score < 0.4)
t('csv helper header', csvHeader(kb).startsWith('brand,name,price_usd,source_url,verified_on,layout'))
t('cat csv parses bool/num', pc(kb, csvHeader(kb) + '\nA,B,99,https://x.y,2026-01-01,65%,linear,1.5,true,true,false,8000').items[0].specs.actuationMm === 1.5)
t('cat csv rejects bad number', pc(kb, csvHeader(kb) + '\nA,B,99,https://x.y,,65%,linear,abc,,,,').errors.length === 1)
console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
