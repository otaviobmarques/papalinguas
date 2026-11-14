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
  pico: number; // pico recente do volume (decai devagar): base do ganho automático
  graves: number; // média recente da fração de graves na fala: cada voz tem o seu equilíbrio
}

export const estadoInicial = (): LipSyncState => ({ visema: 0, frames: 0, rmsAnterior: 0, quietos: 0, pico: PICO_MIN, graves: GRAVES_REF });

/**
 * Ganho automático: os limites de volume abaixo foram calibrados em vozes com pico ~0,2
 * (Maya, Oliver, Lucía). Vozes mais baixas (ex.: "sage" pedindo fala suave, pico ~0,09) ficavam
 * quase sempre "fracas": a boca fazia biquinho ou fechava no lugar das vogais abertas.
 * O volume é reescalado pelo pico recente, que sobe na hora e decai com meia-vida de ~1,5 s.
 */
const PICO_REF = 0.2;
const PICO_MIN = 0.05; // piso do pico: voz muito baixa ou ruído não ganha mais que GANHO_MAX
const DECAI = Math.pow(0.5, 1 / 90); // meia-vida de 90 quadros (~1,5 s a 60 fps)
const GANHO_MAX = 3;
const GANHO_MIN = 0.6;
/** Fração de graves típica das vozes calibradas; o limite "som abafado" (O/U) é 0,58 para elas. */
const GRAVES_REF = 0.46;
const GRAVES_EMA = 1 / 120; // média móvel de ~2 s de fala

/** Volume normalizado pelo pico recente da própria voz. */
export function normalizar(rms: number, pico: number): number {
  const ganho = Math.min(GANHO_MAX, Math.max(GANHO_MIN, PICO_REF / Math.max(pico, PICO_MIN)));
  return rms * ganho;
}

const SILENCIO = 0.012;
// Ritmo de boca de uma pessoa (~5 trocas por segundo, medido nas vozes da OpenAI):
const SEGURAR = 7; // cada posição fica no mínimo ~115 ms
const QUIETO = 3; // fecha a boca depois de ~50 ms de silêncio (com 6 quadros ela ficava aberta ~155 ms depois da fala)

/**
 * Limites calibrados com a voz real da OpenAI medida pelo AnalyserNode do navegador
 * (bytes em escala de dB, por isso as faixas ficam próximas entre si: graves ~0,5, médios ~0,3, agudos ~0,17).
 */
export function classificar(f: AudioFrame, rmsAnterior: number, graves = GRAVES_REF): Visema {
  if (f.rms < SILENCIO) return 0;
  const total = f.low + f.mid + f.high || 1;
  const lo = f.low / total;
  const mi = f.mid / total;
  const hi = f.high / total;
  // queda brusca entre sílabas: lábios fechando (M/B/P)
  if (rmsAnterior > 0.04 && f.rms < rmsAnterior * 0.5) return 5;
  if (hi > 0.24) return 6; // chiado: F/V/S
  // som abafado: O forte, U fraco. Vozes com mais grave (ex.: "sage" suave) sobem o limite junto.
  if (lo > 0.58 + Math.max(0, graves - GRAVES_REF)) return f.rms > 0.035 ? 3 : 4;
  if (mi > 0.34) return 2; // E/I
  return f.rms > 0.035 ? 1 : 2; // vogal aberta quando há volume
}

export function proximoVisema(s: LipSyncState, f: AudioFrame): LipSyncState {
  // o silêncio é decidido no volume real (ruído não pode virar fala); o resto usa o volume normalizado
  const pico = Math.max(f.rms, (s.pico ?? PICO_MIN) * DECAI, PICO_MIN);
  const rms = f.rms < SILENCIO ? f.rms : normalizar(f.rms, pico);
  const g = s.graves ?? GRAVES_REF;
  const total = f.low + f.mid + f.high;
  const graves = f.rms >= SILENCIO && total > 0 ? g + (f.low / total - g) * GRAVES_EMA : g;
  const v = classificar({ ...f, rms }, s.rmsAnterior, graves);
  const quietos = v === 0 ? s.quietos + 1 : 0;
  const manter = { ...s, frames: s.frames + 1, rmsAnterior: rms, quietos, pico, graves };
  if (v === s.visema) return manter;
  if (v === 0) return s.visema !== 0 && quietos < QUIETO ? manter : { visema: 0, frames: 1, rmsAnterior: rms, quietos, pico, graves };
  // sair do repouso é na hora; entre posições, respeita o tempo mínimo
  if (s.visema !== 0 && s.frames < SEGURAR) return manter;
  return { visema: v, frames: 1, rmsAnterior: rms, quietos, pico, graves };
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
