export function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-display font-black tracking-[0.28em]" style={{ fontSize: size }}>
      <svg width={size * 1.1} height={size * 1.1} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 4h5l4 11 4-11h5L14 21h-4L3 4Z" fill="rgb(var(--accent))" />
        <path d="M12 2v5" stroke="rgb(var(--accent2))" strokeWidth="1.5" />
      </svg>
      VOLTRIX
    </span>
  )
}
