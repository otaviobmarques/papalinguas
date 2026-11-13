/** Anel de progresso (meta do dia), em SVG. */
export default function AnelMeta({ valor, total, tamanho = 64, children }: { valor: number; total: number; tamanho?: number; children?: React.ReactNode }) {
  const p = Math.max(0, Math.min(1, total ? valor / total : 0));
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: tamanho, height: tamanho }} role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={valor}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)}
          style={{ transition: "stroke-dashoffset .8s ease", filter: "drop-shadow(0 0 6px rgba(24,169,87,.6))" }} />
      </svg>
      <div className="relative text-center leading-none">{children}</div>
    </div>
  );
}
