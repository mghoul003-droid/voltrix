import { CATALOG } from '@/data/mice'
import { CATALOGS } from '@/finders/catalog'
import { CATEGORIES, type Col, type Product } from '@/finders/categories'
import type { Mouse } from './mouseEngine'
export const CATS = ['mouse', 'keyboard', 'mousepad', 'iem', 'headphone', 'monitor']
export const LABEL: Record<string, string> = { mouse: 'Mouse', keyboard: 'Keyboard', mousepad: 'Mousepad', iem: 'IEM', headphone: 'Headphone', monitor: 'Monitor' }
export const MOUSE_COLS: Col[] = [{ key: 'lengthMm', label: 'Length', type: 'num', unit: 'mm' }, { key: 'widthMm', label: 'Width', type: 'num', unit: 'mm' }, { key: 'heightMm', label: 'Height', type: 'num', unit: 'mm' },
  { key: 'weightG', label: 'Weight', type: 'num', unit: 'g' }, { key: 'shape', label: 'Shape', type: 'str' }, { key: 'connectivity', label: 'Connectivity', type: 'str' }, { key: 'sensor', label: 'Sensor', type: 'str' },
  { key: 'pollingHz', label: 'Max polling', type: 'num', unit: 'Hz' }, { key: 'buttons', label: 'Buttons', type: 'num' }]
export const colsFor = (c: string): Col[] => (c === 'mouse' ? MOUSE_COLS : CATEGORIES[c].cols)
const ls = <T,>(k: string): T[] => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
export interface Entry { cat: string; p: Product; raw?: Mouse }
const fromMouse = (m: Mouse): Entry => ({ cat: 'mouse', raw: m, p: { id: m.id, brand: m.brand, name: m.name, priceUsd: m.priceUsd, sourceUrl: m.sourceUrl, verifiedOn: m.verifiedOn, imageUrl: m.imageUrl,
  notes: [...(m.priceNote ? [m.priceNote] : []), ...(m.notes ?? [])], specs: { lengthMm: m.lengthMm, widthMm: m.widthMm, heightMm: m.heightMm, weightG: m.weightG, shape: m.shape, connectivity: m.connectivity, sensor: m.sensor, pollingHz: m.pollingHz, buttons: m.buttons } } })
export function loadAll(): Entry[] {
  const ex = ls<Mouse>('voltrix-mice').filter((e) => !CATALOG.some((c) => c.id === e.id))
  return [...CATALOG, ...ex].map(fromMouse).concat(Object.keys(CATALOGS).flatMap((k) => [...CATALOGS[k], ...ls<Product>('voltrix-cat-' + k)].map((p) => ({ cat: k, p }))))
}
export const numCols = (c: string) => [...colsFor(c).filter((x) => x.type === 'num').map((x) => ({ key: x.key, label: x.label })), { key: 'priceUsd', label: 'Price (USD)' }]
export const val = (p: Product, k: string) => (k === 'priceUsd' ? p.priceUsd : p.specs[k])
export const NA = 'Not available'
