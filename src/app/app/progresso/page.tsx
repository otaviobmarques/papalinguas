"use client";
import { useOnboarding } from "@/lib/client/onboarding";
import { USO_DEMO } from "@/lib/demo/data";

const SEMANAS = [{ s: "S1", m: 22 }, { s: "S2", m: 35 }, { s: "S3", m: 28 }, { s: "S4", m: 41 }];
const CONQUISTAS = [{ t: "7 dias seguidos", ok: true, e: "🔥" }, { t: "100 minutos", ok: true, e: "⏱️" }, { t: "Primeira entrevista simulada", ok: false, e: "💼" }];

/** A7. Progresso */
export default function Progresso() {
  const { estado } = useOnboarding();
  const max = Math.max(...SEMANAS.map((s) => s.m));
  return (
    <main>
      <h1 className="text-2xl font-extrabold">Progresso</h1>
      <section className="card mt-4">
        <div className="flex justify-between"><span className="font-bold">Nível {estado.nivel ?? "B1"}</span><span className="text-sm text-ink-soft">próximo: B2</span></div>
        <div className="mt-2 h-2.5 rounded-full bg-surface-2"><div className="h-full w-[45%] rounded-full bg-brand" /></div>
      </section>
      <section className="card mt-4">
        <h2 className="font-bold">Minutos falados por semana</h2>
        <div className="mt-3 flex h-36 items-end gap-3" role="img" aria-label={SEMANAS.map((s) => `${s.s}: ${s.m} min`).join(", ")}>
          {SEMANAS.map((s) => (
            <div key={s.s} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-bold">{s.m}</span>
              <div className="w-full rounded-t-lg bg-brand" style={{ height: `${(s.m / max) * 100}px` }} />
              <span className="text-xs text-ink-soft">{s.s}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card mt-4">
        <h2 className="font-bold">🔥 Sequência: {USO_DEMO.sequenciaDias} dias</h2>
      </section>
      <section className="mt-4">
        <h2 className="font-bold">Conquistas</h2>
        <ul className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
          {CONQUISTAS.map((c) => <li key={c.t} className={`card p-3 ${c.ok ? "" : "opacity-40"}`}><p className="text-2xl" aria-hidden>{c.e}</p>{c.t}</li>)}
        </ul>
      </section>
      <button className="btn-ghost mt-4 w-full" disabled>Refazer teste de nível (disponível em 18 dias)</button>
    </main>
  );
}
