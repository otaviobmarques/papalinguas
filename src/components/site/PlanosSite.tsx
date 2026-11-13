"use client";
import Link from "next/link";
import { useState } from "react";
import { PACOTE_EXTRA, PLANOS, economiaAnual, formatBRL, precoMensalEquivalente } from "@/lib/domain/plans";
import type { BillingPeriod } from "@/lib/domain/types";

export default function PlanosSite() {
  const [periodo, setPeriodo] = useState<BillingPeriod>("anual");
  return (
    <div>
      <div className="mx-auto grid max-w-xs grid-cols-2 rounded-full border border-line bg-surface p-1" role="radiogroup" aria-label="Período de cobrança">
        {(["mensal", "anual"] as const).map((p) => (
          <button key={p} role="radio" aria-checked={periodo === p} onClick={() => setPeriodo(p)}
            className={`min-h-11 rounded-full font-bold transition ${periodo === p ? "bg-ink text-bg" : "text-ink-soft hover:text-ink"}`}>
            {p === "mensal" ? "Mensal" : <>Anual <span className="ml-1 rounded-full bg-sun px-2 py-0.5 text-xs text-[#0b1220]">até -26%</span></>}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
        {Object.values(PLANOS).map((p) => {
          const destaque = p.code === "fluente";
          return (
            <article key={p.code} className={`holofote relative flex flex-col rounded-3xl border p-7 ${destaque ? "border-brand/60 bg-gradient-to-b from-brand/15 to-surface shadow-[0_30px_80px_-30px_rgba(24,169,87,.5)]" : "border-line bg-surface"}`}>
              {destaque && <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-ink">Mais completo</span>}
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
              <Link href="/comecar" className={`${destaque ? "btn-primary" : "btn border border-line text-ink hover:bg-white/5"} mt-6 w-full rounded-full`}>Começar com o teste de nível grátis</Link>
            </article>
          );
        })}
      </div>

      <div className="mx-auto mt-6 flex max-w-4xl flex-col items-center gap-2 text-center text-sm text-ink-soft">
        <p className="rounded-full border border-sun/30 bg-sun/10 px-4 py-2 font-bold text-sun">Garantia de 7 dias: se não gostar, devolvemos tudo.</p>
        <p>Acabou a cota do mês? Pacote extra de {PACOTE_EXTRA.minutos} minutos por {formatBRL(PACOTE_EXTRA.precoCentavos)}, válido por {PACOTE_EXTRA.validadeDias} dias.</p>
        <p>Pagamento por Pix ou cartão. Renovação automática; cancele quando quiser, sem multa.</p>
      </div>
    </div>
  );
}
