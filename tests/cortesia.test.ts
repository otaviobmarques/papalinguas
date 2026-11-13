import { describe, expect, it } from "vitest";
import { assinaturaVigente, blocosCortesia, mascararEmail } from "@/lib/domain/cortesia";

describe("cortesia", () => {
  const ini = new Date("2026-11-13T00:00:00Z");
  it("30 dias = 1 bloco com a cota do plano", () => {
    const b = blocosCortesia(ini, 30, 150);
    expect(b).toHaveLength(1);
    expect(b[0].segundos).toBe(9000);
    expect(b[0].fim.toISOString()).toBe("2026-12-13T00:00:00.000Z");
  });
  it("365 dias = 13 blocos, o último termina no fim exato", () => {
    const b = blocosCortesia(ini, 365, 300);
    expect(b).toHaveLength(13);
    expect(b.at(-1)!.fim.toISOString()).toBe("2027-11-13T00:00:00.000Z");
    expect(b[1].inicio.getTime()).toBe(b[0].fim.getTime());
  });
  it("vigência: cortesia vence no fim; assinatura que renova segue vigente", () => {
    const agora = new Date("2026-12-20T00:00:00Z");
    expect(assinaturaVigente({ cancel_at_period_end: true, current_period_end: "2026-12-13T00:00:00Z" }, agora)).toBe(false);
    expect(assinaturaVigente({ cancel_at_period_end: true, current_period_end: "2027-01-13T00:00:00Z" }, agora)).toBe(true);
    expect(assinaturaVigente({ cancel_at_period_end: false, current_period_end: "2026-12-13T00:00:00Z" }, agora)).toBe(true);
  });
  it("mascara e-mail", () => {
    expect(mascararEmail("otavio@exemplo.com")).toBe("ot****@exemplo.com");
  });
});
