import { describe, expect, it } from "vitest";
import { diaLocal, minutosPorSemana, sequenciaDias } from "@/lib/domain/progresso";

describe("progresso", () => {
  it("dia local em São Paulo (UTC-3)", () => {
    expect(diaLocal(new Date("2026-11-14T02:00:00Z"))).toBe("2026-11-13");
  });
  it("sequência termina hoje ou ontem", () => {
    expect(sequenciaDias(["2026-11-11", "2026-11-12", "2026-11-13"], "2026-11-13")).toBe(3);
    expect(sequenciaDias(["2026-11-11", "2026-11-12"], "2026-11-13")).toBe(2);
    expect(sequenciaDias(["2026-11-10", "2026-11-11"], "2026-11-13")).toBe(0);
    expect(sequenciaDias([], "2026-11-13")).toBe(0);
  });
  it("minutos por semana, última = semana atual", () => {
    expect(minutosPorSemana([{ dia: "2026-11-13", segundos: 600 }, { dia: "2026-11-07", segundos: 300 }, { dia: "2026-10-01", segundos: 999 }], "2026-11-13"))
      .toEqual([0, 0, 0, 15]);
    expect(minutosPorSemana([{ dia: "2026-11-06", segundos: 120 }], "2026-11-13")).toEqual([0, 0, 2, 0]);
  });
});
