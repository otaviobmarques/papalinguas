"use client";
import { useState } from "react";
import QuotaBar from "@/components/QuotaBar";
import { useOnboarding } from "@/lib/client/onboarding";
import { PACOTE_EXTRA, PLANOS, formatBRL } from "@/lib/domain/plans";
import { USO_DEMO } from "@/lib/demo/data";

/** A9. Minha assinatura — cancelamento em no máximo 2 toques; reembolso pela garantia em 7 dias */
export default function Assinatura() {
  const { estado } = useOnboarding();
  const plano = PLANOS[estado.plano?.code ?? "essencial"];
  const periodo = estado.plano?.periodo ?? "mensal";
  const [confirmar, setConfirmar] = useState<"cancelar" | "reembolso" | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  const emGarantia = true; // demonstração: assinatura feita hoje

  return (
    <main>
      <h1 className="text-2xl font-extrabold">Minha assinatura</h1>
      {feito && <p role="status" className="mt-3 rounded-2xl bg-brand-soft p-3 text-sm font-semibold">{feito}</p>}
      <section className="card mt-4">
        <p className="text-xl font-extrabold">{plano.nome} {periodo}</p>
        <p className="text-sm text-ink-soft">{formatBRL(plano.precos[periodo])} · renova em 13/12/2026 · Pix Automático</p>
        <div className="mt-4"><QuotaBar usados={USO_DEMO.usadosMin} total={USO_DEMO.cotaMin} /></div>
        <div className="mt-3"><QuotaBar usados={USO_DEMO.hojeMin} total={USO_DEMO.limiteDiarioMin} rotulo="Hoje" /></div>
      </section>
      <section id="pacote" className="card mt-4 flex items-center justify-between gap-3">
        <div><p className="font-bold">Pacote extra</p><p className="text-sm text-ink-soft">{PACOTE_EXTRA.minutos} min, válidos por {PACOTE_EXTRA.validadeDias} dias</p></div>
        <button className="btn-primary">{formatBRL(PACOTE_EXTRA.precoCentavos)}</button>
      </section>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-ghost">Mudar de plano</button>
        <button className="btn-ghost" onClick={() => setConfirmar("cancelar")}>Cancelar</button>
      </div>
      {emGarantia && <button className="btn-ghost mt-2 w-full" onClick={() => setConfirmar("reembolso")}>Desistir e receber reembolso (garantia de 7 dias)</button>}
      <section className="mt-6">
        <h2 className="font-bold">Pagamentos e notas fiscais</h2>
        <p className="mt-2 text-sm text-ink-soft">13/11/2026 · {formatBRL(plano.precos[periodo])} · Pago · NFS-e</p>
      </section>
      {confirmar && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 grid place-items-end bg-black/40 p-4 sm:place-items-center">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-extrabold">{confirmar === "cancelar" ? "Cancelar a renovação?" : "Pedir reembolso integral?"}</h2>
            <p className="mt-2 text-sm">{confirmar === "cancelar" ? "Você continua com acesso até o fim do período pago." : "Devolvemos o valor total e a assinatura é encerrada agora."}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => setConfirmar(null)}>Voltar</button>
              <button className="btn-accent" onClick={() => { setFeito(confirmar === "cancelar" ? "Renovação cancelada. Seu acesso vai até 13/12/2026." : "Reembolso solicitado. O valor volta pelo mesmo meio de pagamento."); setConfirmar(null); }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
