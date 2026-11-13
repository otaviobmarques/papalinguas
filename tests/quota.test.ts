import { describe, expect, it } from "vitest";
import { avaliarInicioDeAula, decidirHeartbeat, type LessonGateInput } from "@/lib/domain/quota";

const agora = new Date("2026-11-13T12:00:00Z");
const base = (o: Partial<LessonGateInput> = {}): LessonGateInput => ({
  agora,
  usuario: { status: "ativo" },
  assinatura: { status: "ativa" },
  cota: { cicloRestanteSeg: 100 * 60, extraRestanteSeg: 0 },
  hoje: { segundosFalados: 0, aulas: 0 },
  limites: { limiteDiarioMin: 30, aulasPorDiaMax: 10, duracaoMaxAulaMin: 20, toleranciaInadimplenciaDias: 3 },
  killSwitch: "desligado",
  ...o,
});

describe("avaliarInicioDeAula", () => {
  it("libera aula limitada pela duração máxima", () => {
    expect(avaliarInicioDeAula(base())).toEqual({ ok: true, segundosPermitidos: 1200, avisoCotaBaixa: false });
  });
  it("bloqueia sem assinatura (não há versão gratuita)", () => {
    expect(avaliarInicioDeAula(base({ assinatura: null }))).toEqual({ ok: false, motivo: "sem_assinatura" });
  });
  it("permite em garantia", () => {
    expect(avaliarInicioDeAula(base({ assinatura: { status: "em_garantia" } })).ok).toBe(true);
  });
  it("inadimplente: 3 dias de tolerância", () => {
    const d2 = new Date(agora.getTime() - 2 * 86400000);
    const d4 = new Date(agora.getTime() - 4 * 86400000);
    expect(avaliarInicioDeAula(base({ assinatura: { status: "inadimplente", inadimplenteDesde: d2 } })).ok).toBe(true);
    expect(avaliarInicioDeAula(base({ assinatura: { status: "inadimplente", inadimplenteDesde: d4 } }))).toEqual({ ok: false, motivo: "pagamento_pendente" });
  });
  it("suspensão com prazo vencido libera", () => {
    expect(avaliarInicioDeAula(base({ usuario: { status: "suspenso", suspensoAte: new Date(agora.getTime() - 1) } })).ok).toBe(true);
    expect(avaliarInicioDeAula(base({ usuario: { status: "suspenso", suspensoAte: new Date(agora.getTime() + 1) } })).ok).toBe(false);
    expect(avaliarInicioDeAula(base({ usuario: { status: "banido" } }))).toEqual({ ok: false, motivo: "conta_banida" });
  });
  it("usa pacote extra quando o ciclo acabou e avisa cota baixa", () => {
    const r = avaliarInicioDeAula(base({ cota: { cicloRestanteSeg: 0, extraRestanteSeg: 600 } }));
    expect(r).toEqual({ ok: true, segundosPermitidos: 600, avisoCotaBaixa: true });
  });
  it("cota zerada bloqueia", () => {
    expect(avaliarInicioDeAula(base({ cota: { cicloRestanteSeg: 0, extraRestanteSeg: 0 } }))).toEqual({ ok: false, motivo: "cota_esgotada" });
  });
  it("respeita limite diário e kill switch que reduz pela metade", () => {
    expect(avaliarInicioDeAula(base({ hoje: { segundosFalados: 1800, aulas: 2 } }))).toEqual({ ok: false, motivo: "limite_diario" });
    const r = avaliarInicioDeAula(base({ hoje: { segundosFalados: 600, aulas: 1 }, killSwitch: "reduzir_limite" }));
    expect(r).toEqual({ ok: true, segundosPermitidos: 300, avisoCotaBaixa: false });
    expect(avaliarInicioDeAula(base({ killSwitch: "pausar_aulas" }))).toEqual({ ok: false, motivo: "aulas_pausadas" });
  });
  it("limite de aulas por dia", () => {
    expect(avaliarInicioDeAula(base({ hoje: { segundosFalados: 0, aulas: 10 } }))).toEqual({ ok: false, motivo: "aulas_por_dia" });
  });
});

describe("decidirHeartbeat", () => {
  it("avisa a 2 min e encerra ao zerar", () => {
    expect(decidirHeartbeat(300)).toBe("continuar");
    expect(decidirHeartbeat(120)).toBe("avisar");
    expect(decidirHeartbeat(0)).toBe("encerrar");
  });
});
