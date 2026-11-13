/** Cores do papagaio-verdadeiro, a paleta da marca Papalinguas. */
export const COR = {
  verde: "#18A957", // cor principal
  verdeMata: "#0E7A41", // hover e texto sobre claro
  azul: "#2F80ED", // links, informação (testa do papagaio)
  amarelo: "#FFC83D", // destaques, conquistas (rosto)
  vermelho: "#F0503C", // detalhes, alertas (asa)
  bico: "#3B4A63",
  bico2: "#7A889E",
  noite: "#0B1220", // fundo do site
} as const;

/**
 * Símbolo B (cabeça do papagaio como balão de fala), em viewBox 0 0 100 100.
 * Em texto puro para reaproveitar no favicon, no ícone do app e no banner de prévia.
 */
export function simboloSvg(id = "pl", { comCores = true }: { comCores?: boolean } = {}) {
  const c = COR;
  return `<defs><clipPath id="${id}"><circle cx="44" cy="50" r="34"/></clipPath></defs>
<circle cx="44" cy="50" r="34" fill="${c.verde}"/>
${comCores ? `<g clip-path="url(#${id})"><ellipse cx="54" cy="16" rx="26" ry="14" fill="${c.azul}"/><ellipse cx="62" cy="47" rx="17" ry="15" fill="${c.amarelo}"/><path d="M8 70 Q30 92 60 86 L60 100 L0 100 Z" fill="${c.verdeMata}"/></g>` : ""}
<path d="M18 74 L10 94 L32 82 Z" fill="${c.verde}"/>
<path d="M66 34 C82 32 96 42 95 58 C94 66 89 70 84 68 C86 60 82 52 72 52 Z" fill="${c.bico}"/>
<path d="M70 56 C78 56 83 60 82 66 C78 70 72 68 68 64 Z" fill="${c.bico2}"/>
<circle cx="60" cy="42" r="6.5" fill="#fff"/><circle cx="61.5" cy="42" r="3.6" fill="${c.noite}"/>`;
}
