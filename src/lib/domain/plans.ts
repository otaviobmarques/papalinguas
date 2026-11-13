import type { BillingPeriod, PlanCode } from "./types";

/** Catálogo padrão (Manual 17.1). Fonte de verdade em produção: tabela `plans`. */
export interface PlanOffer {
  code: PlanCode;
  nome: string;
  minutosCiclo: number;
  limiteDiario: number;
  idiomas: number;
  precos: Record<BillingPeriod, number>; // centavos BRL
  recursos: string[];
}

export const PLANOS: Record<PlanCode, PlanOffer> = {
  essencial: {
    code: "essencial",
    nome: "Essencial",
    minutosCiclo: 150,
    limiteDiario: 30,
    idiomas: 1,
    precos: { mensal: 4990, anual: 44990 },
    recursos: ["150 min de conversa por mês (cerca de 5 por dia)", "Todos os tutores do idioma", "Relatório pós-aula", "Revisão espaçada", "Modo Acolher"],
  },
  fluente: {
    code: "fluente",
    nome: "Fluente",
    minutosCiclo: 300,
    limiteDiario: 60,
    idiomas: 3,
    precos: { mensal: 8990, anual: 79990 },
    recursos: ["300 min de conversa por mês (cerca de 10 por dia)", "Tudo do Essencial", "3 idiomas", "Trilhas especiais (entrevista, viagem, prova)", "Relatório detalhado de pronúncia", "Prioridade no suporte"],
  },
};

export const PACOTE_EXTRA = { minutos: 60, precoCentavos: 2990, validadeDias: 90 };

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Economia do anual em relação a 12 mensalidades, em % inteiro. */
export function economiaAnual(plan: PlanOffer): number {
  const doze = plan.precos.mensal * 12;
  return Math.round(((doze - plan.precos.anual) / doze) * 100);
}

export function precoMensalEquivalente(plan: PlanOffer): number {
  return Math.round(plan.precos.anual / 12);
}

/**
 * Upgrade (Manual 8.4): cobra a diferença proporcional aos dias restantes do ciclo.
 * Valores em centavos; arredonda para cima a favor da empresa não é permitido — arredonda ao centavo.
 */
export function valorProporcionalUpgrade(params: {
  precoAtualCentavos: number;
  precoNovoCentavos: number;
  inicioCiclo: Date;
  fimCiclo: Date;
  agora: Date;
}): number {
  const { precoAtualCentavos, precoNovoCentavos, inicioCiclo, fimCiclo, agora } = params;
  const total = fimCiclo.getTime() - inicioCiclo.getTime();
  if (total <= 0) throw new Error("ciclo inválido");
  const restante = Math.min(Math.max(fimCiclo.getTime() - agora.getTime(), 0), total);
  const diff = precoNovoCentavos - precoAtualCentavos;
  if (diff <= 0) return 0;
  return Math.round((diff * restante) / total);
}
