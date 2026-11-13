import type { KillSwitchMode, SubscriptionStatus, UserStatus } from "./types";

/** Entrada para decidir se o aluno pode começar uma aula (Manual 8.1 e 12.2). */
export interface LessonGateInput {
  agora: Date;
  usuario: { status: UserStatus; suspensoAte?: Date | null };
  assinatura: { status: SubscriptionStatus; inadimplenteDesde?: Date | null } | null;
  cota: { cicloRestanteSeg: number; extraRestanteSeg: number };
  hoje: { segundosFalados: number; aulas: number };
  limites: {
    limiteDiarioMin: number;
    aulasPorDiaMax: number;
    duracaoMaxAulaMin: number;
    toleranciaInadimplenciaDias: number;
  };
  killSwitch: KillSwitchMode;
}

export type LessonGateReason =
  | "conta_suspensa"
  | "conta_banida"
  | "conta_inativa"
  | "sem_assinatura"
  | "pagamento_pendente"
  | "cota_esgotada"
  | "limite_diario"
  | "aulas_por_dia"
  | "aulas_pausadas";

export type LessonGateResult =
  | { ok: true; segundosPermitidos: number; avisoCotaBaixa: boolean }
  | { ok: false; motivo: LessonGateReason };

const DIA_MS = 86_400_000;

export function limiteDiarioEfetivoMin(limiteMin: number, kill: KillSwitchMode): number {
  // Kill switch ao atingir 100% do teto: limite diário cai pela metade (Manual 15.1)
  return kill === "reduzir_limite" ? Math.floor(limiteMin / 2) : limiteMin;
}

export function avaliarInicioDeAula(i: LessonGateInput): LessonGateResult {
  const { usuario, assinatura, agora } = i;

  if (usuario.status === "banido") return { ok: false, motivo: "conta_banida" };
  if (usuario.status === "suspenso") {
    if (!usuario.suspensoAte || usuario.suspensoAte > agora) return { ok: false, motivo: "conta_suspensa" };
  } else if (usuario.status !== "ativo") {
    return { ok: false, motivo: "conta_inativa" };
  }

  if (i.killSwitch === "pausar_aulas") return { ok: false, motivo: "aulas_pausadas" };

  if (!assinatura) return { ok: false, motivo: "sem_assinatura" };
  if (assinatura.status === "inadimplente") {
    const desde = assinatura.inadimplenteDesde ?? agora;
    const dentroTolerancia = agora.getTime() - desde.getTime() < i.limites.toleranciaInadimplenciaDias * DIA_MS;
    if (!dentroTolerancia) return { ok: false, motivo: "pagamento_pendente" };
  } else if (assinatura.status !== "ativa" && assinatura.status !== "em_garantia") {
    return { ok: false, motivo: "sem_assinatura" };
  }

  if (i.hoje.aulas >= i.limites.aulasPorDiaMax) return { ok: false, motivo: "aulas_por_dia" };

  const totalCota = i.cota.cicloRestanteSeg + i.cota.extraRestanteSeg;
  if (totalCota <= 0) return { ok: false, motivo: "cota_esgotada" };

  const limiteDiarioSeg = limiteDiarioEfetivoMin(i.limites.limiteDiarioMin, i.killSwitch) * 60;
  const restanteHoje = limiteDiarioSeg - i.hoje.segundosFalados;
  if (restanteHoje <= 0) return { ok: false, motivo: "limite_diario" };

  const segundosPermitidos = Math.min(totalCota, restanteHoje, i.limites.duracaoMaxAulaMin * 60);
  return { ok: true, segundosPermitidos, avisoCotaBaixa: totalCota < 15 * 60 };
}

/** Resposta do heartbeat (a cada 30 s): continuar, avisar (faltam 2 min) ou encerrar. */
export function decidirHeartbeat(restanteSeg: number, avisoMin = 2): "continuar" | "avisar" | "encerrar" {
  if (restanteSeg <= 0) return "encerrar";
  if (restanteSeg <= avisoMin * 60) return "avisar";
  return "continuar";
}

export const MENSAGENS_BLOQUEIO: Record<LessonGateReason, string> = {
  conta_suspensa: "Sua conta está suspensa no momento. Fale com o suporte.",
  conta_banida: "Esta conta foi encerrada por violação dos Termos de Uso.",
  conta_inativa: "Sua conta não está ativa.",
  sem_assinatura: "Escolha um plano para começar a conversar.",
  pagamento_pendente: "Não conseguimos renovar sua assinatura. Atualize o pagamento para voltar às aulas.",
  cota_esgotada: "Seus minutos do mês acabaram. A revisão continua liberada.",
  limite_diario: "Você atingiu o limite de hoje. Amanhã tem mais!",
  aulas_por_dia: "Você atingiu o número máximo de aulas de hoje.",
  aulas_pausadas: "As aulas estão temporariamente pausadas. Voltamos em breve.",
};
