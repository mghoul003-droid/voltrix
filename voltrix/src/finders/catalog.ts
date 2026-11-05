import type { Product } from './categories'
// Verified catalogs. Every entry needs a sourceUrl and verifiedOn; unknown specs stay undefined.
// Empty until verified data is added here or via the in-app CSV import (kept in the browser).
export const CATALOGS: Record<string, Product[]> = { keyboard: [], mousepad: [], iem: [], headphone: [], monitor: [] }
