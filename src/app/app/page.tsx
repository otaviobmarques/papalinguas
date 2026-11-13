"use client";
import Link from "next/link";
import TutorCharacter from "@/components/TutorCharacter";
import AnelMeta from "@/components/AnelMeta";
import Icone from "@/components/Icone";
import QuotaBar from "@/components/QuotaBar";
import { iconeDoCenario } from "@/lib/client/iconeCenario";
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
        <div className="relative size-14 shrink-0">
          <Link href="/comecar/tutor?voltar=/app" aria-label={`Trocar tutor (atual: ${tutor.nome})`} className="block size-14 overflow-hidden rounded-full ring-2 ring-brand/70 ring-offset-2 ring-offset-bg">
            <TutorCharacter slug={tutor.slug} enquadramento="rosto" visual={tutor.visual} nome={tutor.nome} expressao="sorriso" className="h-full w-full" />
          </Link>
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-bg bg-brand" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink-soft">{tutor.nome} está esperando você</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Olá{r.nome ? `, ${r.nome.split(" ")[0]}` : ""}!</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-sun/30 bg-sun/10 px-3 py-1.5 text-sun" aria-label={`Sequência de ${r.sequencia} dias`}>
          <Icone nome="fogo" className="size-5" />
          <span className="text-sm font-extrabold">{r.sequencia}</span>
        </div>
      </header>

      <section className="card mt-5 flex items-center gap-4 p-4">
        <AnelMeta valor={r.hojeMin} total={r.metaDiaria}>
          <span className="text-lg font-extrabold">{r.hojeMin}</span>
          <span className="block text-[10px] text-ink-soft">de {r.metaDiaria}</span>
        </AnelMeta>
        <div className="flex-1">
          <p className="font-bold">Meta de hoje</p>
          <p className="text-sm text-ink-soft">
            {r.hojeMin >= r.metaDiaria ? "Meta cumprida. Mandou bem!" : `Faltam ${r.metaDiaria - r.hojeMin} min de conversa`}
          </p>
        </div>
        {r.hojeMin >= r.metaDiaria && <Icone nome="trofeu" className="size-7 text-sun" />}
      </section>

      {semAssinatura ? (
        <section className="card mt-4 border-brand/50">
          <p className="font-extrabold">{aluno?.assinatura?.status === "expirada" ? "Sua assinatura terminou" : "Escolha um plano para conversar"}</p>
          <p className="mt-1 text-sm text-ink-soft">As aulas por voz fazem parte dos planos. A revisão do que você já aprendeu continua liberada.</p>
          <Link href="/comecar/planos" className="btn-primary mt-4 w-full">Ver planos</Link>
        </section>
      ) : r.restanteMin <= 0 ? (
        <section className="card mt-4 border-danger/50">
          <p className="font-extrabold">Seus minutos do mês acabaram</p>
          <p className="text-sm text-ink-soft">A revisão continua liberada. Para conversar agora:</p>
          <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/app/assinatura" className="btn-primary">Fazer upgrade</Link><Link href="/app/assinatura#pacote" className="btn-ghost">Pacote extra</Link></div>
        </section>
      ) : (
        <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-brand/40 bg-[radial-gradient(ellipse_at_top_right,rgba(24,169,87,.45),transparent_60%),linear-gradient(160deg,#123a28,#0d1628_70%)] p-5 shadow-[0_30px_60px_-30px_rgba(24,169,87,.7)]">
          <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full border border-white/10" aria-hidden />
          <div className="pointer-events-none absolute -right-2 -top-2 size-24 rounded-full border border-white/10" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5ee29b]">Aula de hoje{recomendado ? ` · ${recomendado.nivel}` : ""}</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#5ee29b]"><Icone nome={recomendado ? iconeDoCenario(recomendado) : "conversa"} /></span>
            <div>
              <h2 className="text-xl font-extrabold leading-tight">{recomendado ? recomendado.titulo : `Conversa livre com ${tutor.nome}`}</h2>
              <p className="mt-1 text-sm text-ink-soft">{recomendado ? recomendado.situacao : "Ainda não há cenários publicados neste idioma. Converse sobre o que quiser."}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Link href={recomendado ? `/app/aula?cenario=${recomendado.slug}` : "/app/aula"} className="btn-primary group flex-1">
              <Icone nome="mic" className="size-5" /> Começar
            </Link>
            {recomendado && <span className="inline-flex items-center gap-1 text-sm text-ink-soft"><Icone nome="relogio" className="size-4" />{recomendado.minutos} min</span>}
          </div>
        </section>
      )}

      {!semAssinatura && r.restanteMin > 0 && r.restanteMin < 15 && (
        <p role="status" className="mt-3 rounded-2xl border border-warn/30 bg-warn-soft p-3 text-sm font-semibold text-warn">
          Faltam só {r.restanteMin} min no mês. <Link href="/app/assinatura" className="underline">Ver opções</Link>
        </p>
      )}

      <section className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold">
        <Link href="/app/aula" className="card flex flex-col items-center gap-2 p-3 transition hover:border-white/20">
          <span className="grid size-10 place-items-center rounded-xl bg-brand/15 text-[#5ee29b]"><Icone nome="conversa" className="size-5" /></span>Modo livre
        </Link>
        <Link href="/app/revisao" className="card flex flex-col items-center gap-2 p-3 transition hover:border-white/20">
          <span className="grid size-10 place-items-center rounded-xl bg-sky/15 text-sky"><Icone nome="cartoes" className="size-5" /></span>{r.cartoes ? `Revisar ${r.cartoes}` : "Revisão"}
        </Link>
        {ultima?.cenarioSlug ? (
          <Link href={`/app/aulas/${ultima.cenarioSlug}`} className="card flex flex-col items-center gap-2 p-3 transition hover:border-white/20">
            <span className="grid size-10 place-items-center rounded-xl bg-sun/15 text-sun"><Icone nome="repetir" className="size-5" /></span><span className="line-clamp-1">Repetir</span>
          </Link>
        ) : (
          <Link href="/app/aulas" className="card flex flex-col items-center gap-2 p-3 transition hover:border-white/20">
            <span className="grid size-10 place-items-center rounded-xl bg-sun/15 text-sun"><Icone nome="aulas" className="size-5" /></span>Ver aulas
          </Link>
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
