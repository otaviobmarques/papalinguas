/**
 * Lip sync v1 (Manual 3.3): escolhe 1 de 7 visemas a partir do volume e das faixas
 * de frequência do áudio do tutor (~60x por segundo). Função pura para testar sem navegador.
 */
export const VISEMAS = ["repouso", "A", "E/I", "O", "U/W", "M/B/P", "F/V"] as const;
export type Visema = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AudioFrame {
  rms: number; // 0..1
  low: number; // energia 80–700 Hz (0..1)
  mid: number; // 700–2500 Hz
  high: number; // 2500–8000 Hz
}

export interface LipSyncState {
  visema: Visema;
  frames: number; // quantos quadros o visema atual já ficou
  rmsAnterior: number;
  quietos: number; // quadros seguidos de silêncio
}

export const estadoInicial = (): LipSyncState => ({ visema: 0, frames: 0, rmsAnterior: 0, quietos: 0 });

const SILENCIO = 0.012;
// Ritmo de boca de uma pessoa (~5 trocas por segundo, medido nas vozes da OpenAI):
const SEGURAR = 7; // cada posição fica no mínimo ~115 ms
const QUIETO = 6; // só fecha a boca depois de ~100 ms de silêncio (pausas entre sílabas não contam)

/**
 * Limites calibrados com a voz real da OpenAI medida pelo AnalyserNode do navegador
 * (bytes em escala de dB, por isso as faixas ficam próximas entre si: graves ~0,5, médios ~0,3, agudos ~0,17).
 */
export function classificar(f: AudioFrame, rmsAnterior: number): Visema {
  if (f.rms < SILENCIO) return 0;
  const total = f.low + f.mid + f.high || 1;
  const lo = f.low / total;
  const mi = f.mid / total;
  const hi = f.high / total;
  // queda brusca entre sílabas: lábios fechando (M/B/P)
  if (rmsAnterior > 0.04 && f.rms < rmsAnterior * 0.5) return 5;
  if (hi > 0.24) return 6; // chiado: F/V/S
  if (lo > 0.58) return f.rms > 0.035 ? 3 : 4; // som abafado: O forte, U fraco
  if (mi > 0.34) return 2; // E/I
  return f.rms > 0.035 ? 1 : 2; // vogal aberta quando há volume
}

export function proximoVisema(s: LipSyncState, f: AudioFrame): LipSyncState {
  const v = classificar(f, s.rmsAnterior);
  const quietos = v === 0 ? s.quietos + 1 : 0;
  const manter = { ...s, frames: s.frames + 1, rmsAnterior: f.rms, quietos };
  if (v === s.visema) return manter;
  if (v === 0) return s.visema !== 0 && quietos < QUIETO ? manter : { visema: 0, frames: 1, rmsAnterior: f.rms, quietos };
  // sair do repouso é na hora; entre posições, respeita o tempo mínimo
  if (s.visema !== 0 && s.frames < SEGURAR) return manter;
  return { visema: v, frames: 1, rmsAnterior: f.rms, quietos };
}

/** Extrai as faixas de um FFT (Uint8Array do AnalyserNode). */
export function frameDeFFT(bins: ArrayLike<number>, sampleRate: number, rms: number): AudioFrame {
  const hzPorBin = sampleRate / 2 / bins.length;
  const faixa = (de: number, ate: number) => {
    const a = Math.max(0, Math.floor(de / hzPorBin));
    const b = Math.min(bins.length - 1, Math.ceil(ate / hzPorBin));
    let s = 0;
    for (let i = a; i <= b; i++) s += bins[i];
    return s / ((b - a + 1) * 255);
  };
  return { rms, low: faixa(80, 700), mid: faixa(700, 2500), high: faixa(2500, 8000) };
}
