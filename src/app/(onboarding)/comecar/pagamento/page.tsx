"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding } from "@/lib/client/onboarding";
import { PLANOS, formatBRL } from "@/lib/domain/plans";
import { cpfValido } from "@/lib/domain/cpf";

/**
 * A10. Pagamento (Pix ou cartão). Cartão: formulário do gateway (dados nunca passam pelo nosso servidor).
 * O plano só é liberado pelo webhook de pagamento confirmado.
 * TODO(sprint 4): POST /api/assinaturas + Supabase Realtime para confirmar o Pix.
 */
export default function Pagamento() {
  const { estado, atualizar, pronto } = useOnboarding();
  const router = useRouter();
  const [aba, setAba] = useState<"pix" | "cartao">("pix");
  const [cpf, setCpf] = useState("");
  const [pixAutomatico, setPixAutomatico] = useState(true);
  const [fase, setFase] = useState<"form" | "aguardando" | "aprovado">("form");
  const [restante, setRestante] = useState(15 * 60);

  useEffect(() => {
    if (fase !== "aguardando") return;
    const t = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [fase]);

  if (!pronto) return null;
  const p = PLANOS[estado.plano?.code ?? "essencial"];
  const periodo = estado.plano?.periodo ?? "mensal";
  const valor = p.precos[periodo];
  const cpfOk = cpfValido(cpf);

  if (fase === "aprovado") {
    return (
      <OnboardingShell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-6xl" aria-hidden>🎉</p>
          <h1 className="mt-4 text-3xl font-extrabold">Bem-vindo ao {p.nome}!</h1>
          <p className="mt-2 text-ink-soft">Você tem {p.minutosCiclo} minutos de conversa por mês. Sua garantia de 7 dias começa hoje.</p>
          <button className="btn-primary mt-8 w-full" onClick={() => { atualizar({ assinante: true, passo: "/app" }); router.push("/app"); }}>Ir para minha primeira aula</button>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell voltar="/comecar/planos">
      <section className="card">
        <p className="text-sm text-ink-soft">Você está assinando</p>
        <p className="text-xl font-extrabold">{p.nome} {periodo}</p>
        <p className="text-2xl font-extrabold">{formatBRL(valor)}<span className="text-base font-semibold text-ink-soft">{periodo === "anual" ? " por ano" : " por mês"}</span></p>
      </section>

      <div className="mt-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1" role="tablist">
        {(["pix", "cartao"] as const).map((a) => (
          <button key={a} role="tab" aria-selected={aba === a} onClick={() => setAba(a)} className={`min-h-11 rounded-xl font-bold ${aba === a ? "bg-surface shadow" : "text-ink-soft"}`}>
            {a === "pix" ? "Pix" : "Cartão"}
          </button>
        ))}
      </div>

      <label htmlFor="cpf" className="mt-4 block font-semibold">CPF <span className="font-normal text-ink-soft">(para o pagamento e a nota fiscal)</span></label>
      <input id="cpf" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00"
        className="mt-1 min-h-12 w-full rounded-2xl border border-line bg-surface px-4" aria-invalid={cpf.length > 0 && !cpfOk} />
      {cpf.length >= 11 && !cpfOk && <p className="mt-1 text-sm text-danger">CPF inválido.</p>}

      {aba === "pix" ? (
        fase === "aguardando" ? (
          <div className="card mt-4 text-center">
            <div className="mx-auto grid size-48 place-items-center rounded-2xl bg-surface-2 text-sm text-ink-soft" role="img" aria-label="QR Code do Pix">QR Code do Pix</div>
            <button className="btn-ghost mt-3 w-full" onClick={() => navigator.clipboard?.writeText("00020126...demo")}>Copiar código Pix</button>
            <p className="mt-3 text-sm" aria-live="polite">Aguardando pagamento… expira em {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}</p>
            <button className="mt-3 text-sm font-semibold text-brand underline" onClick={() => setFase("aprovado")}>(demonstração) Simular Pix pago</button>
          </div>
        ) : (
          <>
            <label className="mt-4 flex min-h-11 items-start gap-3">
              <input type="checkbox" className="mt-1 size-5 accent-[var(--brand)]" checked={pixAutomatico} onChange={(e) => setPixAutomatico(e.target.checked)} />
              <span><b>Pix Automático:</b> renova sem você precisar pagar todo {periodo === "anual" ? "ano" : "mês"}. Você autoriza uma vez no app do seu banco.</span>
            </label>
            <button className="btn-primary mt-6 w-full" disabled={!cpfOk} onClick={() => setFase("aguardando")}>Gerar Pix de {formatBRL(valor)}</button>
          </>
        )
      ) : (
        <div className="mt-4">
          <p className="rounded-2xl bg-surface-2 p-3 text-sm">🔒 O pagamento com cartão abre na página segura do Asaas. Os dados do cartão não passam pelos nossos servidores.</p>
          <button className="btn-primary mt-6 w-full" disabled={!cpfOk} onClick={() => setFase("aprovado")}>Pagar {formatBRL(valor)} com cartão</button>
        </div>
      )}
    </OnboardingShell>
  );
}
