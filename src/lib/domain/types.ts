export type LangCode = "en" | "es" | "pt";
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1";
export type UserStatus = "ativo" | "suspenso" | "banido" | "em_exclusao" | "excluido";
export type SubscriptionStatus =
  | "pendente"
  | "em_garantia"
  | "ativa"
  | "inadimplente"
  | "cancelada"
  | "expirada";
export type PlanCode = "essencial" | "fluente";
export type BillingPeriod = "mensal" | "anual";
export type KillSwitchMode = "desligado" | "reduzir_limite" | "modelo_barato" | "pausar_aulas";

export const LANGUAGES: Record<LangCode, { nome: string; bandeira: string }> = {
  en: { nome: "Inglês", bandeira: "🇺🇸" },
  es: { nome: "Espanhol", bandeira: "🇪🇸" },
  pt: { nome: "Português (para estrangeiros)", bandeira: "🇧🇷" },
};

export const CEFR_DESCRICAO: Record<Cefr, string> = {
  A1: "Iniciante: você se apresenta e entende frases simples.",
  A2: "Básico: você resolve situações do dia a dia, como pedir comida e perguntar caminhos.",
  B1: "Intermediário: você conversa sobre trabalho, viagens e planos, mesmo com alguns erros.",
  B2: "Intermediário avançado: você discute ideias e participa de reuniões com confiança.",
  C1: "Avançado: você se expressa com fluência e precisão em quase qualquer assunto.",
};
