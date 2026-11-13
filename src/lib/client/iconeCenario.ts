/** Ícone de traço para um cenário, pelo objetivo/tema (no lugar dos emojis). */
export function iconeDoCenario(c: { objetivos?: string[]; temas?: string[] }): string {
  const o = c.objetivos ?? [];
  const t = c.temas ?? [];
  if (o.includes("carreira") || t.includes("negocios")) return "carreira";
  if (o.includes("viagem") || t.includes("viagem")) return "viagem";
  if (o.includes("prova")) return "prova";
  if (o.includes("morar")) return "casa";
  return "conversa";
}
