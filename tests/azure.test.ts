import { describe, expect, it, vi } from "vitest";
import { normalizarRegiao, urlTokenAzure, validarAzure } from "@/lib/providers/azureSpeech";

describe("Azure Speech", () => {
  it("normaliza a região do jeito que aparece no portal", () => {
    expect(normalizarRegiao("East US")).toBe("eastus");
    expect(normalizarRegiao(" Brazil South ")).toBe("brazilsouth");
    expect(urlTokenAzure("West Europe")).toBe("https://westeurope.api.cognitive.microsoft.com/sts/v1.0/issueToken");
  });
  it("valida emitindo um token e explica o 401", async () => {
    const ok = vi.fn(async () => new Response("tok", { status: 200 }));
    expect(await validarAzure("k".repeat(32), "East US", ok as unknown as typeof fetch)).toEqual({ ok: true });
    const nao = vi.fn(async () => new Response("", { status: 401 }));
    const r = await validarAzure("k".repeat(32), "eastus", nao as unknown as typeof fetch);
    expect(r.ok).toBe(false);
    expect(await validarAzure("k".repeat(32), "a!", ok as unknown as typeof fetch)).toMatchObject({ ok: false });
  });
});

import { descobrirRegiao } from "@/lib/providers/azureSpeech";

describe("Azure Speech: região automática", () => {
  it("acha a única região que aceita a chave", async () => {
    const f = vi.fn(async (url: string | URL | Request) => new Response("", { status: String(url).includes("://brazilsouth.") ? 200 : 401 }));
    expect(await descobrirRegiao("k", f as unknown as typeof fetch)).toBe("brazilsouth");
    const r = await validarAzure("k", "", f as unknown as typeof fetch);
    expect(r).toEqual({ ok: true, regiao: "brazilsouth" });
  });
  it("sem nenhuma região válida, explica", async () => {
    const f = vi.fn(async () => new Response("", { status: 401 }));
    expect(await validarAzure("k", "", f as unknown as typeof fetch)).toMatchObject({ ok: false });
  });
});
