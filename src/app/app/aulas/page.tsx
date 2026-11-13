"use client";
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
      <h1 className="text-2xl font-extrabold">Aulas</h1>
      <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cenário" aria-label="Buscar cenário"
        className="mt-3 min-h-12 w-full rounded-2xl border border-line bg-surface px-4" />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button className="chip shrink-0" aria-pressed={!tema} onClick={() => setTema(null)}>Todos</button>
        {temas.map((t) => <button key={t} className="chip shrink-0 capitalize" aria-pressed={tema === t} onClick={() => setTema(t)}>{t}</button>)}
      </div>

      {!busca && !tema && (
        <section className="mt-5">
          <h2 className="font-extrabold">Para seu objetivo</h2>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
            {objetivo.map((c) => (
              <Link key={c.slug} href={`/app/aulas/${c.slug}`} className="card w-40 shrink-0 p-4">
                <p className="text-3xl" aria-hidden>{c.emoji}</p><p className="mt-2 font-bold leading-tight">{c.titulo}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {unidades.map((u) => (
        <section key={u} className="mt-6">
          <h2 className="font-extrabold">{u}</h2>
          <ul className="mt-2 space-y-2">
            {lista.filter((c) => c.unidade === u).map((c) => {
              const desafio = ORDEM.indexOf(c.nivel) > ORDEM.indexOf(nivel);
              return (
                <li key={c.slug}>
                  <Link href={`/app/aulas/${c.slug}`} className="card flex items-center gap-3 p-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-2xl" aria-hidden>{c.emoji}</span>
                    <span className="flex-1">
                      <span className="block font-bold">{c.titulo}</span>
                      <span className="text-sm text-ink-soft">{c.minutos} min · {c.nivel}</span>
                    </span>
                    {desafio && <span className="rounded-full bg-accent-soft px-2 py-1 text-xs font-bold text-accent">desafio</span>}
                    {c.fluenteOnly && <span aria-label="Plano Fluente">🔒</span>}
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
