"use client";
import Link from "next/link";
import { use } from "react";
import { useOnboarding } from "@/lib/client/onboarding";
import { resumoTela, useAluno, useCenarios } from "@/lib/client/aluno";

const TTS = { en: "en-US", es: "es-MX", pt: "pt-BR" } as const;

/** A2.1. Detalhe do cenário */
export default function DetalheCenario({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { estado } = useOnboarding();
  const { aluno } = useAluno();
  const r = resumoTela(aluno, estado);
  const lista = useCenarios();
  if (!lista) return <p className="mt-10 text-center text-ink-soft">Carregando…</p>;
  const c = lista.find((x) => x.slug === slug);
  const planoFluente = aluno ? aluno.assinatura?.plano?.codigo === "fluente" : false;
  if (!c) return <p>Cenário não encontrado. <Link href="/app/aulas" className="underline">Voltar</Link></p>;
  const restante = r.restanteMin;
  const bloqueado = c.fluenteOnly && !planoFluente;
  const limiteDiario = r.limiteDiario > 0 && r.hojeMin >= r.limiteDiario;

  const ouvir = (t: string) => {
    try {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = TTS[c.idioma];
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {}
  };

  return (
    <main>
      <Link href="/app/aulas" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-soft">← Aulas</Link>
      <p className="text-5xl" aria-hidden>{c.emoji}</p>
      <h1 className="mt-2 text-2xl font-extrabold">{c.titulo}</h1>
      <p className="mt-1 text-lg">{c.situacao}</p>

      <section className="card mt-4">
        <h2 className="font-extrabold">Suas missões</h2>
        <ol className="mt-2 space-y-2">{c.missoes.map((m, i) => <li key={m} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">{i + 1}</span>{m}</li>)}</ol>
      </section>

      <section className="card mt-4">
        <h2 className="font-extrabold">Vocabulário útil</h2>
        <ul className="mt-2 divide-y divide-line">
          {c.vocabulario.map((v) => (
            <li key={v.termo} className="flex items-center justify-between py-2">
              <span><b>{v.termo}</b> <span className="text-ink-soft">· {v.traducao}</span></span>
              <button onClick={() => ouvir(v.termo)} className="grid size-11 place-items-center rounded-full hover:bg-surface-2" aria-label={`Ouvir ${v.termo}`}>🔊</button>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 text-sm text-ink-soft">Cerca de {c.minutos} min · usa até {c.minutos} dos seus {restante} min restantes no mês</p>

      {limiteDiario && <p role="status" className="mt-3 rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn">Você atingiu o limite de hoje. Libera amanhã à 0h.</p>}

      {bloqueado ? (
        <Link href="/app/assinatura" className="btn-accent mt-4 w-full">🔒 Disponível no Fluente · Fazer upgrade</Link>
      ) : (
        <Link href={`/app/aula?cenario=${c.slug}`} aria-disabled={limiteDiario} className={`btn-primary mt-4 w-full ${limiteDiario ? "pointer-events-none opacity-50" : ""}`}>Começar</Link>
      )}
    </main>
  );
}
