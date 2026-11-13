import { describe, expect, it, vi } from "vitest";
import { ambienteDaChave, registrarWebhookAsaas, validarAsaas } from "@/lib/providers/payments/asaasSetup";

const resp = (status: number, json: unknown) => new Response(JSON.stringify(json), { status });

describe("Asaas: configuração pelo painel", () => {
  it("detecta o ambiente pela chave", () => {
    expect(ambienteDaChave("$aact_hmlg_000abc")).toBe("sandbox");
    expect(ambienteDaChave("$aact_prod_000abc")).toBe("production");
  });

  it("valida a chave consultando a conta", async () => {
    const f = vi.fn(async () => resp(200, { email: "conta@exemplo.com" }));
    const r = await validarAsaas("$aact_hmlg_xyz", f as unknown as typeof fetch);
    expect(r).toEqual({ ok: true, email: "conta@exemplo.com", ambiente: "sandbox" });
    expect(String((f.mock.calls[0] as unknown[])[0])).toBe("https://api-sandbox.asaas.com/v3/myAccount");
    expect(await validarAsaas("sk-errada", f as unknown as typeof fetch)).toMatchObject({ ok: false });
    const f401 = vi.fn(async () => resp(401, {}));
    expect(await validarAsaas("$aact_hmlg_x", f401 as unknown as typeof fetch)).toMatchObject({ ok: false });
  });

  it("cria o webhook com token forte quando não existe", async () => {
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (!init?.method) return resp(200, { data: [] });
      return resp(200, { id: "wh_1" });
    });
    const r = await registrarWebhookAsaas({ chave: "$aact_hmlg_x", url: "https://app/api/webhooks/asaas", email: "a@b.c" }, f as unknown as typeof fetch);
    expect(r.id).toBe("wh_1");
    expect(r.token.length).toBeGreaterThanOrEqual(32);
    const [url, init] = f.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://api-sandbox.asaas.com/v3/webhooks");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ url: "https://app/api/webhooks/asaas", authToken: r.token, enabled: true, sendType: "SEQUENTIALLY" });
    expect(body.events).toContain("PAYMENT_CONFIRMED");
  });

  it("atualiza o webhook existente para a mesma URL", async () => {
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (!init?.method) return resp(200, { data: [{ id: "wh_9", url: "https://app/api/webhooks/asaas" }] });
      return resp(200, { id: "wh_9" });
    });
    await registrarWebhookAsaas({ chave: "$aact_hmlg_x", url: "https://app/api/webhooks/asaas", email: "a@b.c" }, f as unknown as typeof fetch);
    const [url, init] = f.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://api-sandbox.asaas.com/v3/webhooks/wh_9");
    expect(init.method).toBe("PUT");
  });
});
