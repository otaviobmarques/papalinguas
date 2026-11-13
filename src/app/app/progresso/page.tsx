"use client";
import Link from "next/link";
import { useOnboarding } from "@/lib/client/onboarding";
import { resumoTela, useAluno } from "@/lib/client/aluno";
import { CEFR_DESCRICAO, type Cefr } from "@/lib/domain/types";

const SEMANAS_DEMO = [22, 35, 28, 41];
const NIVEIS: Cefr[] = ["A1", "A2", "B1", "B2", "C1"];

/** A7. Progresso */
export default function Progresso() {
  const { estado, pronto } = useOnboarding();
  const { aluno, carregando } = useAluno();
  if (!pronto || carregando) return <p className="mt-10 text-center text-ink-soft">Carregando…</p>;
  const r = resumoTela(aluno, estado);
  const semanas = aluno ? aluno.minutosPorSemana : SEMANAS_DEMO;
  const totalSemanas = semanas.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...semanas);
  const aulas = aluno ? aluno.aulasConcluidas : 12;
  const nivel = (NIVEIS.includes(r.nivel as Cefr) ? r.nivel : "A1") as Cefr;
  const proximo = NIVEIS[NIVEIS.indexOf(nivel) + 1];

  const testadoEm = aluno?.perfil?.nivelTestadoEm ? new Date(aluno.perfil.nivelTestadoEm) : null;
  const diasParaRefazer = testadoEm ? Math.max(0, 30 - Math.floor((Date.now() - testadoEm.getTime()) / 86_400_000)) : 0;

  const conquistas = [
    { t: "Primeira conversa", ok: aulas >= 1 || !!aluno?.conquistas.includes("primeira_aula"), e: "🎙️" },
    { t: "7 dias seguidos", ok: r.sequencia >= 7 || !!aluno?.conquistas.includes("sequencia_7"), e: "🔥" },
    { t: "100 minutos", ok: totalSemanas >= 100 || !!aluno?.conquistas.includes("minutos_100"), e: "⏱️" },
    { t: "Primeira entrevista simulada", ok: !!aluno?.conquistas.includes("primeira_entrevista") || !aluno, e: "💼" },
  ];

  return (
    <main>
      <h1 className="text-2xl font-extrabold">Progresso</h1>

      <section className="card mt-4">
        <div className="flex justify-between"><span className="text-lg font-extrabold">Nível {nivel}</span>{proximo && <span className="text-sm text-ink-soft">próximo: {proximo}</span>}</div>
        <p className="mt-1 text-sm text-ink-soft">{CEFR_DESCRICAO[nivel]}</p>
        {aluno?.perfil?.confiancaNivel != null && aluno.perfil.confiancaNivel < 0.6 && (
          <p className="mt-2 text-xs text-ink-soft">Seu nível ainda está sendo ajustado nas primeiras aulas.</p>
        )}
      </section>

      {aluno && aulas < 3 ? (
        <section className="card mt-4 text-center">
          <p className="text-4xl" aria-hidden>🌱</p>
          <h2 className="mt-2 font-extrabold">Seu progresso começa agora</h2>
          <p className="mt-1 text-sm text-ink-soft">Depois de 3 aulas, você vai ver aqui seus minutos por semana, sua evolução e suas conquistas.</p>
          <Link href="/app" className="btn-primary mt-4 w-full">Fazer uma aula</Link>
        </section>
      ) : (
        <section className="card mt-4">
          <h2 className="font-bold">Minutos falados por semana</h2>
          <div className="mt-3 flex h-36 items-end gap-3" role="img" aria-label={semanas.map((m, i) => `semana ${i + 1}: ${m} min`).join(", ")}>
            {semanas.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold">{m}</span>
                <div className="w-full rounded-t-lg bg-brand" style={{ height: `${Math.max(2, (m / max) * 100)}px` }} />
                <span className="text-xs text-ink-soft">{i === semanas.length - 1 ? "esta" : `-${semanas.length - 1 - i}`}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="card p-4"><p className="text-2xl font-extrabold">🔥 {r.sequencia}</p><p className="text-xs text-ink-soft">dias seguidos</p></div>
        <div className="card p-4"><p className="text-2xl font-extrabold">{aulas}</p><p className="text-xs text-ink-soft">aulas concluídas</p></div>
      </section>

      <section className="mt-4">
        <h2 className="font-bold">Conquistas</h2>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
          {conquistas.map((c) => (
            <li key={c.t} className={`card p-3 ${c.ok ? "" : "opacity-40"}`}>
              <p className="text-2xl" aria-hidden>{c.e}</p>{c.t}<span className="sr-only">{c.ok ? " (conquistada)" : " (bloqueada)"}</span>
            </li>
          ))}
        </ul>
      </section>

      {diasParaRefazer > 0 ? (
        <button className="btn-ghost mt-4 w-full" disabled>Refazer teste de nível (disponível em {diasParaRefazer} dias)</button>
      ) : (
        <Link href="/comecar/nivel" className="btn-ghost mt-4 w-full">Refazer teste de nível</Link>
      )}
    </main>
  );
}
