import "server-only";
import { randomBytes } from "node:crypto";
import { lerChave } from "@/lib/keys/store";
import { createAsaas } from "./asaas";
import type { PaymentProvider } from "./types";

/** Ambiente pela própria chave: $aact_hmlg_… = sandbox; $aact_prod_… = produção. */
export function ambienteDaChave(chave: string): "sandbox" | "production" {
  if (chave.includes("_prod_")) return "production";
  if (chave.includes("_hmlg_")) return "sandbox";
  return process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
}

export const baseAsaas = (amb: "sandbox" | "production") =>
  amb === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";

/** Gateway Asaas com a chave e o token do webhook guardados no cofre do painel. */
export async function asaasDoCofre(): Promise<PaymentProvider | null> {
  const [chave, token] = await Promise.all([lerChave("asaas", "principal"), lerChave("asaas", "webhook")]);
  if (!chave) return null;
  return createAsaas({ apiKey: chave, env: ambienteDaChave(chave), webhookToken: token ?? "" });
}

type FetchLike = typeof fetch;

/** Confere a chave consultando a conta (leitura, sem custo). Devolve o e-mail da conta. */
export async function validarAsaas(chave: string, f: FetchLike = fetch): Promise<{ ok: true; email: string; ambiente: string } | { ok: false; motivo: string }> {
  if (!chave.startsWith("$aact_")) return { ok: false, motivo: "Chaves do Asaas começam com $aact_." };
  const amb = ambienteDaChave(chave);
  try {
    const r = await f(`${baseAsaas(amb)}/myAccount`, { headers: { access_token: chave, "User-Agent": "papalinguas" } });
    if (r.status === 401) return { ok: false, motivo: `O Asaas (${amb}) recusou a chave (401).` };
    if (!r.ok) return { ok: false, motivo: `O Asaas respondeu ${r.status}.` };
    const d = (await r.json()) as { email?: string };
    return { ok: true, email: d.email ?? "", ambiente: amb };
  } catch {
    return { ok: false, motivo: "Não foi possível falar com o Asaas agora." };
  }
}

const EVENTOS = [
  "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED", "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE",
  "SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED",
];

/**
 * Cria (ou atualiza, se já existir para a mesma URL) o webhook no Asaas com um token novo.
 * O token volta para ser guardado cifrado no cofre; o Asaas o envia em cada aviso.
 */
export async function registrarWebhookAsaas(p: { chave: string; url: string; email: string; idExistente?: string | null }, f: FetchLike = fetch) {
  const base = baseAsaas(ambienteDaChave(p.chave));
  const headers = { access_token: p.chave, "Content-Type": "application/json", "User-Agent": "papalinguas" };
  const token = "whsec_" + randomBytes(36).toString("base64url");
  const corpo = {
    name: "Papalinguas", url: p.url, email: p.email, enabled: true, interrupted: false,
    apiVersion: 3, authToken: token, sendType: "SEQUENTIALLY", events: EVENTOS,
  };

  let id = p.idExistente ?? null;
  if (!id) {
    const lista = await f(`${base}/webhooks`, { headers });
    if (lista.ok) {
      const d = (await lista.json()) as { data?: { id: string; url: string }[] };
      id = d.data?.find((w) => w.url === p.url)?.id ?? null;
    }
  }
  const r = await f(id ? `${base}/webhooks/${id}` : `${base}/webhooks`, { method: id ? "PUT" : "POST", headers, body: JSON.stringify(corpo) });
  if (!r.ok) throw new Error(`Asaas webhook ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = (await r.json()) as { id: string };
  return { id: d.id ?? id!, token };
}
