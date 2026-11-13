import dados from "./fotos.json";

/** Fotos dos tutores geradas por scripts/tutores-fotos.py (posições em fração da imagem). */
export interface Regiao { x: number; y: number; w: number; h: number }
export interface FotoTutor {
  base: string;
  card: string;
  animado: boolean;
  boca?: Regiao;
  olhos?: Regiao;
  rosto?: Regiao;
  expressoes?: { feliz?: string; surpresa?: string };
}

const FOTOS = dados as Record<string, FotoTutor>;

export const fotoDoTutor = (slug?: string | null): FotoTutor | undefined => (slug ? FOTOS[slug] : undefined);
/** Tutor com boca e olhos animados (conjunto completo entregue). */
export const temFotoAnimada = (slug?: string | null) => !!fotoDoTutor(slug)?.animado;
