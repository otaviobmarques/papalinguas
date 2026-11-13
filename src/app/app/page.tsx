"use client";
import Link from "next/link";
import TutorCharacter from "@/components/TutorCharacter";
import QuotaBar from "@/components/QuotaBar";
import { useOnboarding } from "@/lib/client/onboarding";
import { resumoTela, useAluno, useCenarios } from "@/lib/client/aluno";
import { tutorPorSlug } from "@/lib/demo/data";

const ORDEM = ["A1", "A2", "B1", "B2", "C1"];

/** A1. Início (Hoje) */
export default function Inicio() {
  const { estado, pronto } = useOnboarding();
  const { aluno, carregando } = useAluno();
  const r = resumoTela(aluno, estado);
  const cenarios = useCenarios(r.idioma);
  if (!pronto || carregando) return <p className="mt-10 text-center text-ink-soft" aria-live="polite">Carregando…</p>;

  const tutor = tutorPorSlug(r.tutorSlug);
  const fluente = aluno?.assinatura?.plano?.codigo === "fluente";
  // Recomendação: do objetivo e do nível do aluno; depois o nível mais próximo
  const disponiveis = (cenarios ?? []).filter((c) => fluente || !c.fluenteOnly);
  const recomendado =
    disponiveis.find((c) => c.nivel === r.nivel && c.objetivos.includes(r.objetivo)) ??
    disponiveis.find((c) => c.objetivos.includes(r.objetivo)) ??
    [...disponiveis].sort((a, b) => Math.abs(ORDEM.indexOf(a.nivel) - ORDEM.indexOf(r.nivel)) - Math.abs(ORDEM.indexOf(b.nivel) - ORDEM.indexOf(r.nivel)))[0];
  const ultima = aluno?.ultimaAula;
  const semAssinatura = !!aluno && !aluno.assinatura?.ativa;

  return (
    <main>
      <header className="flex items-center gap-3">
        <div className="size-16 overflow-hidden rounded-full bg-brand-soft">
          <TutorCharacter visual={tutor.visual} nome={tutor.nome} expressao="sorriso" className="h-full w-full" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-ink-soft">{tutor.nome} está esperando você</p>
          <h1 className="text-2xl font-extrabold">Olá{r.nome ? `, ${r.nome.split(" ")[0]}` : ""}!</h1>
        </div>
        <div className="text-center" aria-label={`Sequência de ${r.sequencia} dias`}>
          <p className="text-2xl" aria-hidden>🔥</p>
          <p className="text-sm font-extrabold">{r.sequencia}</p>
        </div>
      </header>

      <section className="card mt-4">
        <div className="flex justify-between text-sm"><span className="font-semibold">Meta de hoje</span><span className="text-ink-soft">{r.hojeMin} de {r.metaDiaria} min</span></div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (r.hojeMin / r.metaDiaria) * 100)}%` }} /></div>
        {r.hojeMin >= r.metaDiaria && <p className="mt-2 font-bold text-ok">🎉 Meta do dia cumprida!</p>}
      </section>

      {semAssinatura ? (
        <section className="card mt-4 border-brand">
          <p className="font-extrabold">{aluno?.assinatura?.status === "expirada" ? "Sua assinatura terminou" : "Escolha um plano para conversar"}</p>
          <p className="mt-1 text-sm text-ink-soft">As aulas por voz fazem parte dos planos. A revisão do que você já aprendeu continua liberada.</p>
          <Link href="/comecar/planos" className="btn-primary mt-3 w-full">Ver planos</Link>
        </section>
      ) : r.restanteMin <= 0 ? (
        <section className="card mt-4 border-danger">
          <p className="font-extrabold">Seus minutos do mês acabaram</p>
          <p className="text-sm text-ink-soft">A revisão continua liberada. Para conversar agora:</p>
          <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/app/assinatura" className="btn-primary">Fazer upgrade</Link><Link href="/app/assinatura#pacote" className="btn-ghost">Pacote extra</Link></div>
        </section>
      ) : recomendado ? (
        <section className="mt-4 overflow-hidden rounded-3xl bg-brand p-5 text-brand-ink">
          <p className="text-sm font-bold opacity-90">Aula de hoje · {recomendado.nivel}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{recomendado.emoji} {recomendado.titulo}</h2>
          <p className="mt-1 opacity-90">{recomendado.situacao}</p>
          <p className="mt-2 text-sm opacity-90">Cerca de {recomendado.minutos} min</p>
          <Link href={`/app/aula?cenario=${recomendado.slug}`} className="btn mt-4 w-full bg-surface text-ink">Começar</Link>
        </section>
      ) : (
        <section className="mt-4 overflow-hidden rounded-3xl bg-brand p-5 text-brand-ink">
          <p className="text-sm font-bold opacity-90">Aula de hoje</p>
          <h2 className="mt-1 text-2xl font-extrabold">💬 Conversa livre com {tutor.nome}</h2>
          <p className="mt-1 opacity-90">Ainda não há cenários publicados neste idioma. Converse sobre o que quiser.</p>
          <Link href="/app/aula" className="btn mt-4 w-full bg-surface text-ink">Começar</Link>
        </section>
      )}

      {!semAssinatura && r.restanteMin > 0 && r.restanteMin < 15 && (
        <p role="status" className="mt-3 rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn">
          Faltam só {r.restanteMin} min no mês. <Link href="/app/assinatura" className="underline">Ver opções</Link>
        </p>
      )}

      <section className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold">
        <Link href="/app/aula" className="card p-3">💬<br />Modo livre</Link>
        <Link href="/app/revisao" className="card p-3">🃏<br />{r.cartoes ? `Revisar ${r.cartoes} cartões` : "Revisão"}</Link>
        {ultima?.cenarioSlug ? (
          <Link href={`/app/aulas/${ultima.cenarioSlug}`} className="card p-3">⏯️<br />Repetir {ultima.titulo}</Link>
        ) : (
          <Link href="/app/aulas" className="card p-3">📚<br />Ver aulas</Link>
        )}
      </section>

      {!semAssinatura && (
        <section className="card mt-4">
          <QuotaBar usados={r.cotaUsada} total={r.cotaTotal || 1} />
          {aluno?.cota.extraMin ? <p className="mt-2 text-xs text-ink-soft">+ {aluno.cota.extraMin} min de pacote extra</p> : null}
        </section>
      )}
    </main>
  );
}
