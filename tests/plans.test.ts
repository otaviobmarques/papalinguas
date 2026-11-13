import { describe, expect, it } from "vitest";
import { PLANOS, economiaAnual, valorProporcionalUpgrade, formatBRL } from "@/lib/domain/plans";
import { cpfValido, mascararCpf } from "@/lib/domain/cpf";
import { novaMeiaVida, proximaRevisao } from "@/lib/domain/srs";

describe("planos", () => {
  it("economia do anual ~25%", () => {
    expect(economiaAnual(PLANOS.essencial)).toBe(25);
    expect(economiaAnual(PLANOS.fluente)).toBe(26);
  });
  it("formata BRL", () => {
    expect(formatBRL(4990).replace(/\s/g, " ")).toBe("R$ 49,90");
  });
  it("upgrade proporcional aos dias restantes", () => {
    const inicio = new Date("2026-11-01T00:00:00Z");
    const fim = new Date("2026-12-01T00:00:00Z");
    const agora = new Date("2026-11-16T00:00:00Z");
    expect(valorProporcionalUpgrade({ precoAtualCentavos: 4990, precoNovoCentavos: 8990, inicioCiclo: inicio, fimCiclo: fim, agora })).toBe(2000);
    expect(valorProporcionalUpgrade({ precoAtualCentavos: 8990, precoNovoCentavos: 4990, inicioCiclo: inicio, fimCiclo: fim, agora })).toBe(0);
  });
});

describe("cpf", () => {
  it("valida dígitos", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(mascararCpf("52998224725")).toBe("***.982.***-**");
  });
});

describe("srs", () => {
  it("ajusta meia-vida e agenda", () => {
    expect(novaMeiaVida(24, "facil")).toBe(60);
    expect(novaMeiaVida(5, "errei")).toBe(4);
    const agora = new Date("2026-11-13T00:00:00Z");
    const prox = proximaRevisao(agora, 24, 0.5);
    expect(prox.toISOString()).toBe("2026-11-14T00:00:00.000Z");
  });
});

import { linguaDeApoio, montarInstrucoes, regraApoio, regraCorrecao } from "@/lib/domain/tutorPrompt";

describe("modo livre", () => {
  const base = { tutorNome: "Maya", tutorPromptBase: "x", idioma: "en" as const, nivel: "A2" as const, memoria: [], acolher: { ativo: false }, correcoesPorFala: 1 };
  it("ensina a pedir 'como se diz' e usa os interesses", () => {
    const s = montarInstrucoes({ ...base, modo: "livre", interesses: ["Séries", "Tecnologia"] });
    expect(s).toContain("Modo livre (tutor aberto)");
    expect(s).toContain("como se diz");
    expect(s).toContain("Séries, Tecnologia");
    expect(s).toContain("no máximo 1 correção por fala");
  });
  it("correção detalhada explica em português até o B1 e na língua-alvo a partir do B2", () => {
    expect(regraCorrecao({ correcao: "detalhada", correcoesPorFala: 1, nivel: "A2" })).toContain("em português do Brasil");
    expect(regraCorrecao({ correcao: "detalhada", correcoesPorFala: 1, nivel: "B2" })).toContain("na língua que o aluno está aprendendo");
  });
  it("aula com cenário não recebe o bloco do modo livre", () => {
    const s = montarInstrucoes({ ...base, modo: "aula", cenario: { titulo: "t", situacao: "s", missoes: ["m"], vocabulario: ["v"], roteiro: "r" } });
    expect(s).not.toContain("Modo livre");
  });
});

describe("apoio na língua materna", () => {
  const base = { tutorNome: "Maya", tutorPromptBase: "x", idioma: "en" as const, memoria: [], acolher: { ativo: false }, correcoesPorFala: 1 };
  it("iniciante (A1/A2 ou sem nível) aprende em português", () => {
    for (const nivel of ["A1", "A2", null] as const) {
      const s = montarInstrucoes({ ...base, nivel, modo: "livre" });
      expect(s).toContain("Aluno iniciante: aprenda em português do Brasil");
      expect(s).toContain("peça para o aluno repetir");
    }
  });
  it("nível intermediário não vira aula em português, mas explica quando o aluno se perde", () => {
    const s = montarInstrucoes({ ...base, nivel: "B2", modo: "aula", cenario: { titulo: "t", situacao: "s", missoes: ["m"], vocabulario: ["v"], roteiro: "r" } });
    expect(s).not.toContain("Aluno iniciante");
    expect(s).toContain("Se o aluno disser que não entendeu");
  });
  it("quem aprende português recebe apoio em inglês", () => {
    expect(linguaDeApoio("pt")).toBe("inglês");
    expect(regraApoio({ nivel: "A1", idioma: "pt", modo: "livre" }).join(" ")).toContain("aprenda em inglês");
  });
  it("teste de nível acolhe quem não sabe nada", () => {
    expect(montarInstrucoes({ ...base, nivel: null, modo: "nivelamento" })).toContain("tudo bem começar do zero");
  });
});
