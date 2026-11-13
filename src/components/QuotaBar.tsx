export default function QuotaBar({ usados, total, rotulo = "Cota do mês" }: { usados: number; total: number; rotulo?: string }) {
  const pct = Math.min(100, (usados / total) * 100);
  const restante = total - usados;
  const cor = restante <= 0 ? "bg-danger" : restante < 15 ? "bg-warn" : "bg-brand";
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="font-semibold">{rotulo}</span><span className="text-ink-soft">{usados} de {total} min usados</span></div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={usados} aria-label={rotulo}>
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
