"use client";
import Icone from "@/components/Icone";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import LiveLesson, { type ResumoAula } from "@/components/LiveLesson";
import TutorCharacter from "@/components/TutorCharacter";
import { useOnboarding } from "@/lib/client/onboarding";
import { tutorPorSlug } from "@/lib/demo/data";
import { recarregarAluno, resumoTela, useAluno, useCenarios } from "@/lib/client/aluno";

const EXEMPLOS: Record<string, string[]> = {
  en: ["Como se diz \"estou atrasado\"?", "Me ajuda a pedir um café", "Vamos falar sobre séries", "Como eu me apresento numa reunião?"],
  es: ["Como se diz \"estou atrasado\"?", "Me ajuda a pedir um táxi", "Vamos falar sobre música", "Como eu reclamo de um pedido errado?"],
  pt: ["How do I say \"I'm running late\"?", "Help me order at a bakery", "Let's talk about football", "How do I make small talk?"],
};

/** A3. Aula ao vivo — com cenário, ou no Modo Livre (tutor aberto, sem roteiro). */
function Aula() {
  const { estado, pronto } = useOnboarding();
  const router = useRouter();
  const slug = useSearchParams().get("cenario");
  const [correcao, setCorrecao] = useState<"leve" | "detalhada">("leve");
  const [iniciado, setIniciado] = useState(false);
  const { aluno, carregando } = useAluno();
  const cenarios = useCenarios();
  if (!pronto || carregando || (slug && !cenarios)) return null;
  const r = resumoTela(aluno, estado);
  const tutor = tutorPorSlug(r.tutorSlug);
  const cenario = cenarios?.find((c) => c.slug === slug) ?? null;

  function fim(res: ResumoAula) {
    recarregarAluno();
    try {
      sessionStorage.setItem("papalinguas:ultima-aula", JSON.stringify({ ...res, cenario: cenario?.slug ?? null }));
    } catch {}
    router.replace("/app/relatorio");
  }

  if (!cenario && !iniciado) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-6 pt-4">
        <Link href="/app" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-soft">← Início</Link>
        <div className="mx-auto mt-2 size-40 overflow-hidden rounded-full bg-brand-soft">
          <TutorCharacter slug={tutor.slug} enquadramento="rosto" visual={tutor.visual} nome={tutor.nome} expressao="sorriso" className="h-full w-full" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold">Modo livre com {tutor.nome}</h1>
        <p className="mt-2 text-center text-ink-soft">
          Sem roteiro: converse sobre o que quiser e peça ajuda a qualquer momento. {tutor.nome} ensina, corrige e ajuda você a falar.
        </p>

        <section className="card mt-5">
          <h2 className="font-extrabold">Você pode dizer, por exemplo:</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {(EXEMPLOS[tutor.idioma] ?? EXEMPLOS.en).map((e) => <li key={e} className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 py-2"><Icone nome="conversa" className="size-4 shrink-0 text-[#5ee29b]" />{e}</li>)}
          </ul>
        </section>

        <fieldset className="mt-5">
          <legend className="font-extrabold">Como você quer ser corrigido?</legend>
          <div className="mt-2 grid gap-2">
            {([
              ["leve", "Leve", "Só o essencial, sem quebrar o ritmo da conversa."],
              ["detalhada", "Detalhada", "Corrige tudo e explica rapidinho o porquê."],
            ] as const).map(([v, t, d]) => (
              <label key={v} className={`card flex cursor-pointer items-start gap-3 p-4 ${correcao === v ? "border-brand ring-2 ring-brand" : ""}`}>
                <input type="radio" name="correcao" value={v} checked={correcao === v} onChange={() => setCorrecao(v)} className="mt-1 size-5 accent-[var(--brand)]" />
                <span><b>{t}</b><span className="block text-sm text-ink-soft">{d}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="mt-4 text-center text-xs text-ink-soft">Usa os minutos do seu plano, como qualquer aula. Até 20 min por conversa.</p>
        <button className="btn-primary mt-auto w-full" onClick={() => setIniciado(true)}>Começar a conversar</button>
      </main>
    );
  }

  return (
    <LiveLesson
      tutor={tutor}
      modo={cenario ? "aula" : "livre"}
      cenario={cenario}
      correcao={correcao}
      segundosLimite={20 * 60}
      cotaRestanteSeg={r.restanteSeg}
      onEncerrar={fim}
    />
  );
}

export default function Page() {
  return <Suspense><Aula /></Suspense>;
}
