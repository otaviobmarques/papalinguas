"use client";
import Link from "next/link";
import { useState } from "react";
import { PACOTE_EXTRA, PLANOS, economiaAnual, formatBRL, precoMensalEquivalente } from "@/lib/domain/plans";
import type { BillingPeriod } from "@/lib/domain/types";

export default function PlanosSite() {
  const [periodo, setPeriodo] = useState<BillingPeriod>("anual");
  return (
    <div>
      <div className="mx-auto grid max-w-xs grid-cols-2 rounded-2xl bg-surface-2 p-1" role="radiogroup" aria-label="Período de cobrança">
        {(["mensal", "anual"] as const).map((p) => (
          <button key={p} role="radio" aria-checked={periodo === p} onClick={() => setPeriodo(p)}
            className={`min-h-11 rounded-xl font-bold ${periodo === p ? "bg-surface shadow" : "text-ink-soft"}`}>
            {p === "mensal" ? "Mensal" : <>Anual <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-white">até -26%</span></>}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
        {Object.values(PLANOS).map((p) => {
          const destaque = p.code === "fluente";
          return (
            <article key={p.code} className={`card relative flex flex-col p-6 ${destaque ? "border-brand ring-2 ring-brand" : ""}`}>
              {destaque && <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-ink">Mais completo</span>}
              <h3 className="text-2xl font-extrabold">{p.nome}</h3>
              {periodo === "mensal" ? (
                <p className="mt-3"><span className="text-4xl font-extrabold">{formatBRL(p.precos.mensal)}</span><span className="text-ink-soft"> /mês</span></p>
              ) : (
                <p className="mt-3">
                  <span className="text-4xl font-extrabold">{formatBRL(p.precos.anual)}</span><span className="text-ink-soft"> por ano</span>
                  <span className="mt-1 block text-sm text-ink-soft">equivale a {formatBRL(precoMensalEquivalente(p))}/mês · economia de {economiaAnual(p)}%</span>
                </p>
              )}
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {p.recursos.map((r) => <li key={r} className="flex gap-2"><span className="text-brand" aria-hidden>✓</span>{r}</li>)}
                <li className="flex gap-2 text-ink-soft"><span aria-hidden>·</span>Até {p.limiteDiario} min por dia</li>
              </ul>
              <Link href="/comecar" className={`${destaque ? "btn-primary" : "btn-ghost"} mt-6 w-full`}>Começar com o teste de nível grátis</Link>
            </article>
          );
        })}
      </div>

      <div className="mx-auto mt-6 flex max-w-4xl flex-col items-center gap-2 text-center text-sm text-ink-soft">
        <p className="rounded-full bg-brand-soft px-4 py-2 font-bold text-ink">🛡️ Garantia de 7 dias: se não gostar, devolvemos tudo.</p>
        <p>Acabou a cota do mês? Pacote extra de {PACOTE_EXTRA.minutos} minutos por {formatBRL(PACOTE_EXTRA.precoCentavos)}, válido por {PACOTE_EXTRA.validadeDias} dias.</p>
        <p>Pagamento por Pix ou cartão. Renovação automática; cancele quando quiser, em 2 toques.</p>
      </div>
    </div>
  );
}
