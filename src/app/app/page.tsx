"use client";
import Link from "next/link";
import TutorCharacter from "@/components/TutorCharacter";
import QuotaBar from "@/components/QuotaBar";
import { useOnboarding } from "@/lib/client/onboarding";
import { CENARIOS, USO_DEMO, tutorPorSlug } from "@/lib/demo/data";

/** A1. Início (Hoje) */
export default function Inicio() {
  const { estado } = useOnboarding();
  const tutor = tutorPorSlug(estado.tutorSlug);
  const u = USO_DEMO;
  const meta = estado.metaDiaria ?? 10;
  const restante = u.cotaMin - u.usadosMin + u.extraMin;
  const recomendado = CENARIOS.find((c) => c.idioma === tutor.idioma && !c.fluenteOnly && c.objetivos.includes(estado.objetivo ?? "carreira")) ?? CENARIOS[0];
  const nome = estado.email?.split("@")[0];

  return (
    <main>
      <header className="flex items-center gap-3">
        <div className="size-16 overflow-hidden rounded-full bg-brand-soft">
          <TutorCharacter visual={tutor.visual} nome={tutor.nome} expressao="sorriso" className="h-full w-full" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-ink-soft">{tutor.nome} está esperando você</p>
          <h1 className="text-2xl font-extrabold">Olá{nome ? `, ${nome}` : ""}!</h1>
        </div>
        <div className="text-center" aria-label={`Sequência de ${u.sequenciaDias} dias`}>
          <p className="text-2xl" aria-hidden>🔥</p>
          <p className="text-sm font-extrabold">{u.sequenciaDias}</p>
        </div>
      </header>

      <section className="card mt-4">
        <div className="flex justify-between text-sm"><span className="font-semibold">Meta de hoje</span><span className="text-ink-soft">{u.hojeMin} de {meta} min</span></div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (u.hojeMin / meta) * 100)}%` }} /></div>
        {u.hojeMin >= meta && <p className="mt-2 font-bold text-ok">🎉 Meta do dia cumprida!</p>}
      </section>

      {restante <= 0 ? (
        <section className="card mt-4 border-danger">
          <p className="font-extrabold">Seus minutos do mês acabaram</p>
          <p className="text-sm text-ink-soft">A revisão continua liberada. Para conversar agora:</p>
          <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/app/assinatura" className="btn-primary">Fazer upgrade</Link><Link href="/app/assinatura#pacote" className="btn-ghost">Pacote extra</Link></div>
        </section>
      ) : (
        <section className="mt-4 overflow-hidden rounded-3xl bg-brand p-5 text-brand-ink">
          <p className="text-sm font-bold opacity-90">Aula de hoje · {recomendado.nivel}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{recomendado.emoji} {recomendado.titulo}</h2>
          <p className="mt-1 opacity-90">{recomendado.situacao}</p>
          <p className="mt-2 text-sm opacity-90">Cerca de {recomendado.minutos} min</p>
          <Link href={`/app/aula?cenario=${recomendado.slug}`} className="btn mt-4 w-full bg-surface text-ink">Começar</Link>
        </section>
      )}

      {restante > 0 && restante < 15 && (
        <p role="status" className="mt-3 rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn">
          Faltam só {restante} min no mês. <Link href="/app/assinatura" className="underline">Ver opções</Link>
        </p>
      )}

      <section className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold">
        <Link href="/app/aula" className="card p-3">💬<br />Conversa livre</Link>
        <Link href="/app/revisao" className="card p-3">🃏<br />Revisar {u.cartoesHoje} cartões</Link>
        <Link href={`/app/aulas/${CENARIOS[1].slug}`} className="card p-3">⏯️<br />Continuar aula</Link>
      </section>

      <section className="card mt-4"><QuotaBar usados={u.usadosMin} total={u.cotaMin} /></section>
    </main>
  );
}
