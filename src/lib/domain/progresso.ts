/** Cálculos de progresso do aluno (Telas A1/A7), puros para testar. Dias no fuso de São Paulo. */
export const FUSO = "America/Sao_Paulo";

export function diaLocal(d: Date, fuso = FUSO): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function menosDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Sequência de dias praticados: conta dias seguidos com prática terminando hoje,
 * ou ontem (o dia de hoje ainda não acabou, então a sequência não quebra antes da meia-noite).
 */
export function sequenciaDias(diasPraticados: Iterable<string>, hoje: string): number {
  const set = new Set(diasPraticados);
  let inicio = set.has(hoje) ? hoje : set.has(menosDias(hoje, 1)) ? menosDias(hoje, 1) : null;
  if (!inicio) return 0;
  let n = 0;
  while (set.has(inicio)) {
    n++;
    inicio = menosDias(inicio, 1);
  }
  return n;
}

/** Minutos falados nas últimas N semanas (a última é a semana que termina hoje). */
export function minutosPorSemana(registros: { dia: string; segundos: number }[], hoje: string, semanas = 4): number[] {
  const out = Array<number>(semanas).fill(0);
  for (const r of registros) {
    const diff = Math.round((Date.parse(`${hoje}T12:00:00Z`) - Date.parse(`${r.dia}T12:00:00Z`)) / 86_400_000);
    if (diff < 0) continue;
    const idx = semanas - 1 - Math.floor(diff / 7);
    if (idx >= 0) out[idx] += r.segundos;
  }
  return out.map((s) => Math.round(s / 60));
}

export const minutos = (segundos: number) => Math.floor(Math.max(0, segundos) / 60);
