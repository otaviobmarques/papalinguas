import { timingSafeEqual } from "node:crypto";
import type { AssinaturaCriada, EventoTraduzido, MetodoPagamento, PaymentProvider, PlanoCobranca } from "./types";

/**
 * Asaas (gateway principal no Brasil, Manual 9.3).
 * Docs: https://docs.asaas.com — autenticação pelo cabeçalho `access_token`;
 * webhooks trazem o token configurado no cabeçalho `asaas-access-token`.
 */
export interface AsaasConfig {
  apiKey: string;
  env: "sandbox" | "production";
  webhookToken: string;
  fetchImpl?: typeof fetch;
}

const BILLING: Record<MetodoPagamento, string> = {
  pix: "PIX",
  pix_automatico: "PIX", // TODO(sprint 4): fluxo de autorização do Pix Automático (endpoint próprio do Asaas)
  cartao: "CREDIT_CARD",
  boleto: "BOLETO",
};

const toReais = (c: number) => Math.round(c) / 100;
const toCents = (v: unknown) => (typeof v === "number" ? Math.round(v * 100) : undefined);

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function createAsaas(cfg: AsaasConfig): PaymentProvider {
  const base = cfg.env === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
  const f = cfg.fetchImpl ?? fetch;

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await f(`${base}${path}`, {
      method,
      headers: { access_token: cfg.apiKey, "Content-Type": "application/json", "User-Agent": "papalinguas" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Asaas ${method} ${path}: ${res.status} ${text}`);
    return (text ? JSON.parse(text) : {}) as T;
  }

  return {
    code: "asaas",

    async criarCliente(c) {
      const r = await call<{ id: string }>("POST", "/customers", {
        name: c.nome,
        email: c.email,
        cpfCnpj: c.cpf,
        externalReference: c.referenciaExterna,
        notificationDisabled: true, // e-mails são nossos (Resend)
      });
      return r.id;
    },

    async criarAssinatura(clienteId, plano, metodo, referencia): Promise<AssinaturaCriada> {
      const hoje = new Date().toISOString().slice(0, 10);
      const sub = await call<{ id: string }>("POST", "/subscriptions", {
        customer: clienteId,
        billingType: BILLING[metodo],
        value: toReais(plano.valorCentavos),
        nextDueDate: hoje,
        cycle: plano.ciclo === "anual" ? "YEARLY" : "MONTHLY",
        description: plano.descricao,
        externalReference: referencia,
      });
      const pays = await call<{ data: { id: string; invoiceUrl?: string }[] }>("GET", `/subscriptions/${sub.id}/payments`);
      const first = pays.data[0];
      if (!first) return { externalId: sub.id };
      if (metodo === "pix" || metodo === "pix_automatico") {
        const qr = await call<{ encodedImage: string; payload: string; expirationDate: string }>(
          "GET",
          `/payments/${first.id}/pixQrCode`,
        );
        return {
          externalId: sub.id,
          primeiraCobranca: { externalId: first.id, pix: { qrCodeBase64: qr.encodedImage, copiaECola: qr.payload, expiraEm: qr.expirationDate } },
        };
      }
      return { externalId: sub.id, primeiraCobranca: { externalId: first.id, urlPagamento: first.invoiceUrl } };
    },

    async trocarPlano(assinaturaId, novo: PlanoCobranca) {
      await call("PUT", `/subscriptions/${assinaturaId}`, {
        value: toReais(novo.valorCentavos),
        cycle: novo.ciclo === "anual" ? "YEARLY" : "MONTHLY",
        description: novo.descricao,
        updatePendingPayments: true,
      });
    },

    async cancelarAssinatura(assinaturaId) {
      await call("DELETE", `/subscriptions/${assinaturaId}`);
    },

    async reembolsar(pagamentoId, valorCentavos, motivo) {
      const r = await call<{ id?: string }>("POST", `/payments/${pagamentoId}/refund`, {
        value: valorCentavos == null ? undefined : toReais(valorCentavos),
        description: motivo,
      });
      return { externalId: r.id };
    },

    async consultarPagamento(id) {
      const r = await call<{ status: string; value: number }>("GET", `/payments/${id}`);
      return { status: r.status, valorCentavos: toCents(r.value) ?? 0 };
    },

    validarWebhook(headers) {
      const token = headers.get("asaas-access-token");
      return Boolean(token) && safeEqual(token!, cfg.webhookToken);
    },

    traduzirEvento(corpo): EventoTraduzido {
      const b = corpo as {
        id?: string;
        event?: string;
        payment?: { id: string; subscription?: string; value?: number; netValue?: number; billingType?: string };
        subscription?: { id: string };
        invoice?: { id: string; payment?: string };
      };
      if (!b?.id || !b.event) throw new Error("evento Asaas sem id/event");
      const map: Record<string, EventoTraduzido["evento"]> = {
        PAYMENT_CONFIRMED: "pagamento_confirmado",
        PAYMENT_RECEIVED: "pagamento_confirmado",
        PAYMENT_OVERDUE: "pagamento_falhou",
        PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: "pagamento_falhou",
        PAYMENT_REPROVED_BY_RISK_ANALYSIS: "pagamento_falhou",
        PAYMENT_REFUNDED: "reembolso_concluido",
        PAYMENT_CHARGEBACK_REQUESTED: "contestacao_aberta",
        PAYMENT_CHARGEBACK_DISPUTE: "contestacao_aberta",
        SUBSCRIPTION_DELETED: "assinatura_cancelada",
        SUBSCRIPTION_INACTIVATED: "assinatura_cancelada",
        INVOICE_AUTHORIZED: "nota_emitida",
      };
      const metodo: Record<string, MetodoPagamento> = { PIX: "pix", CREDIT_CARD: "cartao", BOLETO: "boleto" };
      const valor = toCents(b.payment?.value);
      const liquido = toCents(b.payment?.netValue);
      return {
        eventId: b.id,
        tipoOriginal: b.event,
        evento: map[b.event] ?? "ignorado",
        pagamentoExternalId: b.payment?.id ?? b.invoice?.payment,
        assinaturaExternalId: b.payment?.subscription ?? b.subscription?.id,
        valorCentavos: valor,
        liquidoCentavos: liquido,
        taxaCentavos: valor != null && liquido != null ? valor - liquido : undefined,
        metodo: b.payment?.billingType ? metodo[b.payment.billingType] : undefined,
      };
    },
  };
}
