"use client";
import Icone from "@/components/Icone";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding } from "@/lib/client/onboarding";
import { PLANOS, PACOTE_EXTRA, economiaAnual, formatBRL, precoMensalEquivalente } from "@/lib/domain/plans";
import type { BillingPeriod, PlanCode } from "@/lib/domain/types";

/** O8. Planos (paywall). Sem plano gratuito e sem "continuar grátis". */
export default function Planos() {
  const { atualizar } = useOnboarding();
  const router = useRouter();
  const [periodo, setPeriodo] = useState<BillingPeriod>("anual");
  const [plano, setPlano] = useState<PlanCode>("essencial");
  const jaUsouGarantia = false; // TODO(sprint 4): vem de GET /api/planos (antiabuso)
  const [verificando, setVerificando] = useState(true);

  // Quem já tem assinatura ativa (ex.: cortesia dada pelo admin) pula o paywall
  useEffect(() => {
    fetch("/api/assinaturas")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { assinatura: { status: string } | null } | null) => {
        if (d?.assinatura && ["ativa", "em_garantia"].includes(d.assinatura.status)) {
          atualizar({ assinante: true, passo: "/app" });
          router.replace("/app");
        } else setVerificando(false);
      })
      .catch(() => setVerificando(false));
  }, [atualizar, router]);
  if (verificando) return null;

  return (
    <OnboardingShell passo={6} voltar="/comecar/tutor">
      <h1 className="text-2xl font-extrabold">Escolha seu plano</h1>
      <div className="mt-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1" role="radiogroup" aria-label="Período">
        {(["mensal", "anual"] as const).map((p) => (
          <button key={p} role="radio" aria-checked={periodo === p} onClick={() => setPeriodo(p)}
            className={`min-h-11 rounded-xl font-bold ${periodo === p ? "bg-surface shadow" : "text-ink-soft"}`}>
            {p === "mensal" ? "Mensal" : <>Anual <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-white">-25%</span></>}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3" role="radiogroup" aria-label="Plano">
        {(Object.values(PLANOS)).map((p) => {
          const ativo = plano === p.code;
          return (
            <button key={p.code} role="radio" aria-checked={ativo} onClick={() => setPlano(p.code)}
              className={`card text-left ${ativo ? "border-brand ring-2 ring-brand" : ""}`}>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold">{p.nome}</span>
                {p.code === "fluente" && <span className="rounded-full bg-brand-soft px-2 py-1 text-xs font-bold text-brand">Mais completo</span>}
              </div>
              {periodo === "mensal" ? (
                <p className="mt-1"><span className="text-2xl font-extrabold">{formatBRL(p.precos.mensal)}</span><span className="text-ink-soft">/mês</span></p>
              ) : (
                <p className="mt-1">
                  <span className="text-2xl font-extrabold">{formatBRL(p.precos.anual)}</span><span className="text-ink-soft"> por ano</span>
                  <span className="block text-sm text-ink-soft">equivale a {formatBRL(precoMensalEquivalente(p))}/mês · economia de {economiaAnual(p)}%</span>
                </p>
              )}
              <ul className="mt-3 space-y-1 text-sm">
                {p.recursos.map((r) => <li key={r} className="flex gap-2"><Icone nome="check" className="mt-0.5 size-4 shrink-0 text-[#5ee29b]" />{r}</li>)}
                <li className="text-ink-soft">Até {p.limiteDiario} min por dia</li>
              </ul>
            </button>
          );
        })}
      </div>

      {!jaUsouGarantia && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-sun/30 bg-sun/10 p-3 text-center text-sm font-bold text-sun"><Icone nome="escudo" className="size-5" /> Garantia de 7 dias: se não gostar, devolvemos tudo.</p>
      )}
      <p className="mt-3 text-center text-xs text-ink-soft">
        Renovação automática; cancele quando quiser, sem multa. Acabou a cota? Pacote extra de {PACOTE_EXTRA.minutos} min por {formatBRL(PACOTE_EXTRA.precoCentavos)}.
      </p>

      <div className="sticky bottom-0 mt-auto bg-bg pb-2 pt-4">
        <button className="btn-primary w-full" onClick={() => { atualizar({ plano: { code: plano, periodo }, passo: "/comecar/pagamento" }); router.push("/comecar/pagamento"); }}>
          Assinar {PLANOS[plano].nome} · {formatBRL(PLANOS[plano].precos[periodo])}{periodo === "anual" ? "/ano" : "/mês"}
        </button>
      </div>
    </OnboardingShell>
  );
}
