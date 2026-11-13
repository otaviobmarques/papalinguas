/** Idiomas oferecidos. Para incluir um novo: migração no enum lang_code, tutores e dados abaixo. */
export const LANG_CODES = ["en", "es", "pt", "fr", "it", "de", "ja"] as const;
export type LangCode = (typeof LANG_CODES)[number];
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

/** nome: em português (telas); ingles: para as instruções da IA; locale: voz do navegador e avaliação de pronúncia. */
export const LANGUAGES: Record<LangCode, { nome: string; bandeira: string; ingles: string; locale: string }> = {
  en: { nome: "Inglês", bandeira: "🇺🇸", ingles: "English", locale: "en-US" },
  es: { nome: "Espanhol", bandeira: "🇪🇸", ingles: "Spanish", locale: "es-MX" },
  pt: { nome: "Português (para estrangeiros)", bandeira: "🇧🇷", ingles: "Brazilian Portuguese", locale: "pt-BR" },
  fr: { nome: "Francês", bandeira: "🇫🇷", ingles: "French", locale: "fr-FR" },
  it: { nome: "Italiano", bandeira: "🇮🇹", ingles: "Italian", locale: "it-IT" },
  de: { nome: "Alemão", bandeira: "🇩🇪", ingles: "German", locale: "de-DE" },
  ja: { nome: "Japonês", bandeira: "🇯🇵", ingles: "Japanese", locale: "ja-JP" },
};

export const CEFR_DESCRICAO: Record<Cefr, string> = {
  A1: "Iniciante: você se apresenta e entende frases simples.",
  A2: "Básico: você resolve situações do dia a dia, como pedir comida e perguntar caminhos.",
  B1: "Intermediário: você conversa sobre trabalho, viagens e planos, mesmo com alguns erros.",
  B2: "Intermediário avançado: você discute ideias e participa de reuniões com confiança.",
  C1: "Avançado: você se expressa com fluência e precisão em quase qualquer assunto.",
};
