import { describe, expect, it, vi } from "vitest";
import { createAsaas } from "@/lib/providers/payments/asaas";

describe("Asaas", () => {
  const asaas = createAsaas({ apiKey: "k", env: "sandbox", webhookToken: "segredo-123" });

  it("valida o token do webhook", () => {
    expect(asaas.validarWebhook(new Headers({ "asaas-access-token": "segredo-123" }), "")).toBe(true);
    expect(asaas.validarWebhook(new Headers({ "asaas-access-token": "errado" }), "")).toBe(false);
    expect(asaas.validarWebhook(new Headers(), "")).toBe(false);
  });

  it("traduz pagamento confirmado com taxa", () => {
    const e = asaas.traduzirEvento({
      id: "evt_1",
      event: "PAYMENT_CONFIRMED",
      payment: { id: "pay_1", subscription: "sub_1", value: 49.9, netValue: 47.92, billingType: "CREDIT_CARD" },
    });
    expect(e).toMatchObject({ eventId: "evt_1", evento: "pagamento_confirmado", pagamentoExternalId: "pay_1", assinaturaExternalId: "sub_1", valorCentavos: 4990, taxaCentavos: 198, metodo: "cartao" });
  });

  it("evento desconhecido é ignorado", () => {
    expect(asaas.traduzirEvento({ id: "e", event: "PAYMENT_VIEWED" }).evento).toBe("ignorado");
  });

  it("cria assinatura Pix e devolve QR", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      void init;
      const u = String(url);
      const json = u.endsWith("/subscriptions") ? { id: "sub_9" }
        : u.endsWith("/subscriptions/sub_9/payments") ? { data: [{ id: "pay_9" }] }
        : { encodedImage: "IMG", payload: "000201...", expirationDate: "2026-11-14" };
      return new Response(JSON.stringify(json), { status: 200 });
    });
    const a = createAsaas({ apiKey: "k", env: "sandbox", webhookToken: "t", fetchImpl: fetchImpl as unknown as typeof fetch });
    const r = await a.criarAssinatura("cus_1", { descricao: "Essencial mensal", valorCentavos: 4990, ciclo: "mensal" }, "pix", "user-1");
    expect(r.primeiraCobranca?.pix?.copiaECola).toBe("000201...");
    const body = JSON.parse(fetchImpl.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ customer: "cus_1", billingType: "PIX", value: 49.9, cycle: "MONTHLY" });
    expect(String(fetchImpl.mock.calls[0][0])).toContain("api-sandbox.asaas.com");
  });
});
