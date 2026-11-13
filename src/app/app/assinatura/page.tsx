"use client";
import Link from "next/link";
import { useState } from "react";
import QuotaBar from "@/components/QuotaBar";
import { useOnboarding } from "@/lib/client/onboarding";
import { resumoTela, useAluno } from "@/lib/client/aluno";
import { PACOTE_EXTRA, PLANOS, formatBRL } from "@/lib/domain/plans";
import { SITE } from "@/lib/site";

const STATUS: Record<string, string> = {
  pendente: "aguardando pagamento", em_garantia: "ativa · em garantia", ativa: "ativa", inadimplente: "pagamento pendente", cancelada: "cancelada", expirada: "encerrada",
};
const METODO: Record<string, string> = { pix: "Pix", pix_automatico: "Pix Automático", cartao: "Cartão", boleto: "Boleto" };
const data = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

/** A9. Minha assinatura — cancelamento em no máximo 2 toques; reembolso pela garantia em 7 dias */
export default function Assinatura() {
  const { estado, pronto } = useOnboarding();
  const { aluno, carregando } = useAluno();
  const [confirmar, setConfirmar] = useState<"cancelar" | "reembolso" | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  if (!pronto || carregando) return <p className="mt-10 text-center text-ink-soft">Carregando…</p>;
  const r = resumoTela(aluno, estado);
  const a = aluno?.assinatura ?? null;
  const cortesia = a?.gateway === "cortesia";

  // Aluno logado sem assinatura
  if (aluno && !a) {
    return (
      <main>
        <h1 className="text-2xl font-extrabold">Minha assinatura</h1>
        <section className="card mt-4 text-center">
          <p className="font-extrabold">Você ainda não tem um plano</p>
          <p className="mt-1 text-sm text-ink-soft">Os planos incluem aulas por voz, relatórios e revisão, com garantia de 7 dias.</p>
          <Link href="/comecar/planos" className="btn-primary mt-4 w-full">Ver planos</Link>
        </section>
      </main>
    );
  }

  const demoPlano = PLANOS[estado.plano?.code ?? "essencial"];
  const demoPeriodo = estado.plano?.periodo ?? "mensal";
  const nome = a?.plano ? `${a.plano.nome} ${a.plano.periodo ?? ""}` : `${demoPlano.nome} ${demoPeriodo}`;
  const preco = a?.plano ? a.plano.precoCentavos : demoPlano.precos[demoPeriodo];
  const emGarantia = aluno ? !!a?.emGarantia : true;

  // Ações de cobrança pelo app chegam com o módulo de pagamentos; até lá, o aluno real é atendido pelo suporte.
  function acao(tipo: "cancelar" | "reembolso") {
    if (!aluno) {
      setFeito(tipo === "cancelar" ? "Renovação cancelada. Seu acesso vai até o fim do período pago." : "Reembolso solicitado. O valor volta pelo mesmo meio de pagamento.");
    } else {
      setFeito(`Para ${tipo === "cancelar" ? "cancelar" : "pedir o reembolso"} agora, escreva para ${SITE.contato}. Respondemos em até 1 dia útil e o pedido vale a partir da data do seu e-mail.`);
    }
    setConfirmar(null);
  }

  return (
    <main>
      <h1 className="text-2xl font-extrabold">Minha assinatura</h1>
      {feito && <p role="status" className="mt-3 rounded-2xl bg-brand-soft p-3 text-sm font-semibold">{feito}</p>}
      {a?.status === "inadimplente" && (
        <p role="alert" className="mt-3 rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn">Não conseguimos renovar sua assinatura. Você tem alguns dias de tolerância para atualizar o pagamento.</p>
      )}

      <section className="card mt-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xl font-extrabold">{nome}</p>
          {a && <span className="rounded-full bg-brand-soft px-2 py-1 text-xs font-bold text-brand">{cortesia ? "cortesia" : STATUS[a.status] ?? a.status}</span>}
        </div>
        <p className="text-sm text-ink-soft">
          {cortesia
            ? `Sem cobrança · válida até ${data(a?.renovaEm)}`
            : a
              ? `${formatBRL(preco)} · ${a.cancelaNoFim ? "termina" : "renova"} em ${data(a.renovaEm)}${a.metodo ? ` · ${METODO[a.metodo] ?? a.metodo}` : ""}`
              : `${formatBRL(preco)} · renova em 13/12/2026 · Pix`}
        </p>
        <div className="mt-4"><QuotaBar usados={r.cotaUsada} total={r.cotaTotal || 1} /></div>
        {aluno?.cota.renovaEm && <p className="mt-1 text-xs text-ink-soft">Minutos renovam em {data(aluno.cota.renovaEm)}</p>}
        {r.limiteDiario > 0 && <div className="mt-3"><QuotaBar usados={r.hojeMin} total={r.limiteDiario} rotulo="Hoje" /></div>}
        {aluno?.cota.extraMin ? <p className="mt-2 text-sm">+ {aluno.cota.extraMin} min de pacote extra</p> : null}
      </section>

      {!cortesia && (
        <>
          <section id="pacote" className="card mt-4 flex items-center justify-between gap-3">
            <div><p className="font-bold">Pacote extra</p><p className="text-sm text-ink-soft">{PACOTE_EXTRA.minutos} min, válidos por {PACOTE_EXTRA.validadeDias} dias</p></div>
            <button className="btn-primary" onClick={() => setFeito(aluno ? "A compra do pacote extra pelo app chega em breve." : "Pacote extra adicionado (demonstração).")}>{formatBRL(PACOTE_EXTRA.precoCentavos)}</button>
          </section>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/comecar/planos" className="btn-ghost">Mudar de plano</Link>
            <button className="btn-ghost" onClick={() => setConfirmar("cancelar")}>Cancelar</button>
          </div>
          {emGarantia && <button className="btn-ghost mt-2 w-full" onClick={() => setConfirmar("reembolso")}>Desistir e receber reembolso (garantia de 7 dias)</button>}
        </>
      )}
      {cortesia && <p className="mt-4 text-sm text-ink-soft">Sua cortesia não renova e não gera cobrança. Quando terminar, você pode escolher um plano.</p>}

      {confirmar && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 grid place-items-end bg-black/40 p-4 sm:place-items-center">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-extrabold">{confirmar === "cancelar" ? "Cancelar a renovação?" : "Pedir reembolso integral?"}</h2>
            <p className="mt-2 text-sm">{confirmar === "cancelar" ? "Você continua com acesso até o fim do período pago." : "Devolvemos o valor total e a assinatura é encerrada."}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => setConfirmar(null)}>Voltar</button>
              <button className="btn-accent" onClick={() => acao(confirmar)}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
