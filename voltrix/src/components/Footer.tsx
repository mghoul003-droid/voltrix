import { Logo } from './Logo'
export function Footer() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center md:px-8">
        <div>
          <Logo size={20} />
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted">Precision meets performance.</p>
        </div>
        <p className="text-sm text-muted">Created by <span className="text-ink">KooKieNinja</span></p>
      </div>
    </footer>
  )
}
