"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding } from "@/lib/client/onboarding";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PLANOS, formatBRL } from "@/lib/domain/plans";
import { cpfValido } from "@/lib/domain/cpf";

/**
 * A10. Pagamento (Pix ou cartão) pelo Asaas.
 * - Cartão: página segura do Asaas em nova aba (dados do cartão nunca passam pelo nosso servidor).
 * - O plano só é liberado pelo webhook de pagamento confirmado; aqui só consultamos a situação.
 * Sem login (modo demonstração) a tela simula o pagamento.
 */
type Fase = "form" | "gerando" | "aguardando" | "aprovado";
interface Pix { qrCodeBase64: string; copiaECola: string; expiraEm: string }

export default function Pagamento() {
  const { estado, atualizar, pronto } = useOnboarding();
  const router = useRouter();
  const [aba, setAba] = useState<"pix" | "cartao">("pix");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [fase, setFase] = useState<Fase>("form");
  const [pix, setPix] = useState<Pix | null>(null);
  const [urlCartao, setUrlCartao] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [real, setReal] = useState<boolean | null>(null);
  const consulta = useRef<ReturnType<typeof setInterval>>(undefined);

  // Modo real quando há aluno logado no Supabase
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return setReal(false);
    sb.auth.getUser().then(({ data }) => setReal(Boolean(data.user)));
  }, []);

  const esperarConfirmacao = useCallback(() => {
    clearInterval(consulta.current);
    consulta.current = setInterval(async () => {
      const r = await fetch("/api/assinaturas").catch(() => null);
      if (!r?.ok) return;
      const d = (await r.json()) as { assinatura: { status: string } | null };
      if (d.assinatura && ["em_garantia", "ativa"].includes(d.assinatura.status)) {
        clearInterval(consulta.current);
        setFase("aprovado");
      }
    }, 4000);
  }, []);
  useEffect(() => () => clearInterval(consulta.current), []);

  if (!pronto || real === null) return null;
  const p = PLANOS[estado.plano?.code ?? "essencial"];
  const periodo = estado.plano?.periodo ?? "mensal";
  const valor = p.precos[periodo];
  const cpfOk = cpfValido(cpf);
  const nomeOk = nome.trim().length >= 3;

  async function pagar(metodo: "pix" | "cartao") {
    setErro(null);
    if (!real) {
      // demonstração
      if (metodo === "pix") {
        setPix({ qrCodeBase64: "", copiaECola: "00020126…demonstracao", expiraEm: "" });
        setFase("aguardando");
      } else setFase("aprovado");
      return;
    }
    setFase("gerando");
    const janela = metodo === "cartao" ? window.open("", "_blank") : null;
    const r = await fetch("/api/assinaturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plano: p.code, periodo, metodo, nome, cpf }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) {
      janela?.close();
      setErro(d.mensagem ?? "Não conseguimos gerar a cobrança. Tente de novo.");
      setFase("form");
      return;
    }
    if (metodo === "pix" && d.pix) setPix(d.pix);
    if (metodo === "cartao" && d.urlPagamento) {
      setUrlCartao(d.urlPagamento);
      if (janela) janela.location.href = d.urlPagamento;
    }
    setFase("aguardando");
    esperarConfirmacao();
  }

  if (fase === "aprovado") {
    return (
      <OnboardingShell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-6xl" aria-hidden>🎉</p>
          <h1 className="mt-4 text-3xl font-extrabold">Bem-vindo ao {p.nome}!</h1>
          <p className="mt-2 text-ink-soft">Pagamento confirmado. Você tem {p.minutosCiclo} minutos de conversa por mês, e sua garantia de 7 dias começa hoje.</p>
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
        <p className="mt-1 text-xs text-ink-soft">Renovação automática. Cancele quando quiser. Garantia de 7 dias na primeira assinatura.</p>
      </section>

      {fase === "aguardando" ? (
        <section className="card mt-4 text-center" aria-live="polite">
          {aba === "pix" && pix ? (
            <>
              {pix.qrCodeBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code do Pix" className="mx-auto size-56 rounded-2xl bg-white p-2" />
              ) : (
                <div className="mx-auto grid size-48 place-items-center rounded-2xl bg-surface-2 text-sm text-ink-soft" role="img" aria-label="QR Code do Pix">QR Code (demonstração)</div>
              )}
              <p className="mt-3 text-sm">Abra o app do seu banco, escolha <b>Pix → Ler QR Code</b> ou use o código abaixo.</p>
              <button className="btn-ghost mt-3 w-full" onClick={async () => { await navigator.clipboard?.writeText(pix.copiaECola).catch(() => {}); setCopiado(true); }}>
                {copiado ? "Código copiado ✓" : "Copiar código Pix (copia e cola)"}
              </button>
              {pix.expiraEm && <p className="mt-2 text-xs text-ink-soft">Válido até {new Date(pix.expiraEm).toLocaleString("pt-BR")}</p>}
            </>
          ) : (
            <>
              <p className="font-bold">Conclua o pagamento na página do Asaas que abrimos em outra aba.</p>
              {urlCartao && <a className="btn-ghost mt-3 w-full" href={urlCartao} target="_blank" rel="noopener noreferrer">Abrir página de pagamento de novo</a>}
            </>
          )}
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold">
            <span className="anim-ring inline-block size-2 rounded-full bg-brand" aria-hidden /> Aguardando a confirmação do pagamento…
          </p>
          {!real && <button className="mt-3 text-sm font-semibold text-brand underline" onClick={() => setFase("aprovado")}>(demonstração) Simular pagamento confirmado</button>}
          <button className="mt-4 min-h-11 text-sm text-ink-soft underline" onClick={() => { clearInterval(consulta.current); setFase("form"); }}>Trocar forma de pagamento</button>
        </section>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1" role="tablist">
            {(["pix", "cartao"] as const).map((a) => (
              <button key={a} role="tab" aria-selected={aba === a} onClick={() => setAba(a)} className={`min-h-11 rounded-xl font-bold ${aba === a ? "bg-surface shadow" : "text-ink-soft"}`}>
                {a === "pix" ? "Pix" : "Cartão"}
              </button>
            ))}
          </div>

          <label htmlFor="nome" className="mt-4 block font-semibold">Nome completo</label>
          <input id="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 min-h-12 w-full rounded-2xl border border-line bg-surface px-4" />

          <label htmlFor="cpf" className="mt-4 block font-semibold">CPF <span className="font-normal text-ink-soft">(para o pagamento e a nota fiscal)</span></label>
          <input id="cpf" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00"
            className="mt-1 min-h-12 w-full rounded-2xl border border-line bg-surface px-4" aria-invalid={cpf.length > 0 && !cpfOk} />
          {cpf.replace(/\D/g, "").length >= 11 && !cpfOk && <p className="mt-1 text-sm text-danger">CPF inválido.</p>}

          {aba === "pix" ? (
            <p className="mt-4 text-sm text-ink-soft">Você recebe o QR Code na hora. A cada renovação, um novo Pix é enviado antes do vencimento.</p>
          ) : (
            <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-sm">🔒 O pagamento com cartão abre na página segura do Asaas. Os dados do cartão não passam pelos nossos servidores.</p>
          )}

          {erro && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{erro}</p>}

          <button className="btn-primary mt-6 w-full" disabled={!cpfOk || !nomeOk || fase === "gerando"} onClick={() => pagar(aba)}>
            {fase === "gerando" ? "Gerando cobrança…" : aba === "pix" ? `Gerar Pix de ${formatBRL(valor)}` : `Pagar ${formatBRL(valor)} com cartão`}
          </button>
        </>
      )}
    </OnboardingShell>
  );
}
