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
}

export const estadoInicial = (): LipSyncState => ({ visema: 0, frames: 0, rmsAnterior: 0 });

const SILENCIO = 0.02;
const SEGURAR = 3; // quadros mínimos (≈50 ms) para a boca não tremer

export function classificar(f: AudioFrame, rmsAnterior: number): Visema {
  if (f.rms < SILENCIO) return 0;
  const total = f.low + f.mid + f.high || 1;
  const lo = f.low / total;
  const mi = f.mid / total;
  const hi = f.high / total;
  // queda brusca entre sílabas: lábios fechando (M/B/P)
  if (rmsAnterior > 0.08 && f.rms < rmsAnterior * 0.45) return 5;
  if (hi > 0.45) return 6;
  if (lo > 0.6) return f.rms < 0.08 ? 4 : 3;
  if (mi > 0.45) return 2;
  return 1;
}

export function proximoVisema(s: LipSyncState, f: AudioFrame): LipSyncState {
  const v = classificar(f, s.rmsAnterior);
  if (v === s.visema) return { visema: v, frames: s.frames + 1, rmsAnterior: f.rms };
  // sair do repouso, silêncio e lábios fechados entram na hora; demais mudanças respeitam o tempo mínimo
  if (s.visema !== 0 && s.frames < SEGURAR && v !== 0 && v !== 5) return { ...s, frames: s.frames + 1, rmsAnterior: f.rms };
  return { visema: v, frames: 1, rmsAnterior: f.rms };
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
