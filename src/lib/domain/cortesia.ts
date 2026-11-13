/** Assinatura cortesia (concedida pelo painel): cota em blocos de 30 dias até o fim do período. */
export const DURACOES_CORTESIA = [30, 90, 180, 365] as const;
export type DuracaoCortesia = (typeof DURACOES_CORTESIA)[number];

const DIA = 86_400_000;

export interface BlocoCota { inicio: Date; fim: Date; segundos: number }

export function blocosCortesia(inicio: Date, dias: number, minutosPorCiclo: number): BlocoCota[] {
  if (dias <= 0) throw new Error("duração inválida");
  const fimTotal = inicio.getTime() + dias * DIA;
  const blocos: BlocoCota[] = [];
  for (let t = inicio.getTime(); t < fimTotal; t += 30 * DIA) {
    blocos.push({ inicio: new Date(t), fim: new Date(Math.min(t + 30 * DIA, fimTotal)), segundos: minutosPorCiclo * 60 });
  }
  return blocos;
}

/** Assinatura que não renova (cortesia ou cancelada) deixa de valer após o fim do período. */
export function assinaturaVigente(s: { cancel_at_period_end?: boolean | null; current_period_end?: string | null }, agora = new Date()): boolean {
  if (!s.cancel_at_period_end || !s.current_period_end) return true;
  return new Date(s.current_period_end) > agora;
}

/** E-mail parcialmente mascarado (Manual 11.4: dados pessoais mascarados por padrão). */
export function mascararEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!d) return "***";
  return `${u.slice(0, 2)}${"*".repeat(Math.max(1, u.length - 2))}@${d}`;
}
