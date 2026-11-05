import { Suspense, lazy, useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Modules } from '@/components/Modules'
import { Philosophy } from '@/components/Philosophy'
import { PhotoShowcase } from '@/components/PhotoShowcase'
import { Footer } from '@/components/Footer'
import { CATEGORIES } from '@/finders/categories'

// Route pages are lazy-loaded so Recharts and the finders stay out of the homepage bundle.
const MouseFinder = lazy(() => import('@/pages/MouseFinder'))
const CategoryFinder = lazy(() => import('@/pages/CategoryFinder'))
const Database = lazy(() => import('@/pages/Database'))
const MouseDetail = lazy(() => import('@/pages/MouseDetail'))
const Setup = lazy(() => import('@/pages/Setup'))
const Compare = lazy(() => import('@/pages/Compare').then((m) => ({ default: m.Compare })))
const Analytics = lazy(() => import('@/pages/Compare').then((m) => ({ default: m.Analytics })))
const ProGear = lazy(() => import('@/pages/Pro').then((m) => ({ default: m.ProGear })))
const Games = lazy(() => import('@/pages/Pro').then((m) => ({ default: m.Games })))

const NotFound = () => (
  <main className="mx-auto min-h-screen max-w-3xl px-5 pt-32"><p>Page not found. <a className="text-accent underline" href="#top">Go home</a></p></main>
)

function Page({ hash }: { hash: string }) {
  if (hash === '#/mouse-finder') return <MouseFinder />
  if (hash.startsWith('#/finder/')) { const id = hash.slice(9); return CATEGORIES[id] ? <CategoryFinder key={id} id={id} /> : <NotFound /> }
  if (hash === '#/mice') return <Database />
  if (hash.startsWith('#/mice/')) return <MouseDetail id={hash.slice(7)} />
  if (hash === '#/setup') return <Setup />
  if (hash === '#/compare') return <Compare />
  if (hash === '#/analytics') return <Analytics />
  if (hash === '#/pro') return <ProGear />
  if (hash === '#/games') return <Games />
  return <NotFound />
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => {
      const h = window.location.hash
      setHash(h)
      if (h.startsWith('#/')) window.scrollTo(0, 0)
      else setTimeout(() => (h.length > 1 ? document.getElementById(h.slice(1))?.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo(0, 0)), 60)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  if (hash.startsWith('#/')) return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}><Page hash={hash} /></Suspense>
      <Footer />
    </>
  )
  return (
    <>
      <Navbar />
      <main><Hero /><Modules /><Philosophy /><PhotoShowcase /></main>
      <Footer />
    </>
  )
}
