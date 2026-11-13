"use client";
import Icone from "@/components/Icone";
import { iconeDoCenario } from "@/lib/client/iconeCenario";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useOnboarding } from "@/lib/client/onboarding";
import { resumoTela, useAluno, useCenarios } from "@/lib/client/aluno";

const ORDEM = ["A1", "A2", "B1", "B2", "C1"];

/** A2. Aulas (biblioteca de cenários): todos os cenários do nível liberados */
export default function Aulas() {
  const { estado } = useOnboarding();
  const { aluno } = useAluno();
  const r = resumoTela(aluno, estado);
  const nivel = r.nivel;
  const carregados = useCenarios(r.idioma);
  const CENARIOS = useMemo(() => carregados ?? [], [carregados]);
  const [busca, setBusca] = useState("");
  const [tema, setTema] = useState<string | null>(null);
  const temas = [...new Set(CENARIOS.flatMap((c) => c.temas))];

  const lista = useMemo(
    () => CENARIOS.filter((c) => (!tema || c.temas.includes(tema)) && c.titulo.toLowerCase().includes(busca.toLowerCase())),
    [busca, tema, CENARIOS],
  );
  const unidades = [...new Set(lista.map((c) => c.unidade))];
  const objetivo = CENARIOS.filter((c) => c.objetivos.includes(r.objetivo)).slice(0, 3);

  return (
    <main>
      <h1 className="text-2xl font-extrabold tracking-tight">Aulas</h1>
      <div className="relative mt-4">
        <Icone nome="busca" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cenário" aria-label="Buscar cenário"
          className="min-h-12 w-full rounded-2xl border border-line bg-surface pl-12 pr-4 outline-none transition focus:border-brand/60" />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button className="chip shrink-0" aria-pressed={!tema} onClick={() => setTema(null)}>Todos</button>
        {temas.map((t) => <button key={t} className="chip shrink-0 capitalize" aria-pressed={tema === t} onClick={() => setTema(t)}>{t}</button>)}
      </div>

      {!busca && !tema && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Para seu objetivo</h2>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
            {objetivo.map((c) => (
              <Link key={c.slug} href={`/app/aulas/${c.slug}`} className="card w-44 shrink-0 bg-[radial-gradient(ellipse_at_top_left,rgba(24,169,87,.25),transparent_60%)] p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-brand/15 text-[#5ee29b]"><Icone nome={iconeDoCenario(c)} className="size-5" /></span>
                <p className="mt-3 font-bold leading-tight">{c.titulo}</p><p className="mt-1 text-xs text-ink-soft">{c.minutos} min · {c.nivel}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {unidades.map((u) => (
        <section key={u} className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">{u}</h2>
          <ul className="mt-2 space-y-2">
            {lista.filter((c) => c.unidade === u).map((c) => {
              const desafio = ORDEM.indexOf(c.nivel) > ORDEM.indexOf(nivel);
              return (
                <li key={c.slug}>
                  <Link href={`/app/aulas/${c.slug}`} className="card flex items-center gap-3 p-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-[#5ee29b]" aria-hidden><Icone nome={iconeDoCenario(c)} className="size-6" /></span>
                    <span className="flex-1">
                      <span className="block font-bold">{c.titulo}</span>
                      <span className="text-sm text-ink-soft">{c.minutos} min · {c.nivel}</span>
                    </span>
                    {desafio && <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-bold text-accent">desafio</span>}
                    {c.fluenteOnly ? <span aria-label="Plano Fluente" className="text-sun"><Icone nome="cadeadoFechado" className="size-5" /></span> : <Icone nome="chevron" className="size-5 text-ink-soft" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {lista.length === 0 && <p className="mt-6 text-center text-ink-soft">Nenhum cenário encontrado.</p>}
    </main>
  );
}
