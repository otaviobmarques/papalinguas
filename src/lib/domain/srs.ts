/**
 * Revisão espaçada por meia-vida (Manual M08).
 * Probabilidade de lembrar após Δ horas: p = 2^(-Δ/h). Agendamos a próxima revisão
 * quando p cai para o alvo (padrão 0,8): Δ = -h·log2(alvo).
 */
export type Resposta = "errei" | "dificil" | "facil";

export const MEIA_VIDA_MIN_H = 4;
export const MEIA_VIDA_MAX_H = 24 * 365;

export function novaMeiaVida(atualH: number, resposta: Resposta): number {
  const fator = resposta === "facil" ? 2.5 : resposta === "dificil" ? 1.3 : 0.4;
  return Math.min(MEIA_VIDA_MAX_H, Math.max(MEIA_VIDA_MIN_H, atualH * fator));
}

export function proximaRevisao(agora: Date, meiaVidaH: number, alvo = 0.8): Date {
  const deltaH = -meiaVidaH * Math.log2(alvo);
  return new Date(agora.getTime() + deltaH * 3_600_000);
}

export function probabilidadeLembrar(horasDesde: number, meiaVidaH: number): number {
  return Math.pow(2, -horasDesde / meiaVidaH);
}
