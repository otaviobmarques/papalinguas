/**
 * Tutores com vídeos em loop (gerados por IA a partir do retrato): um "falando" e um "ouvindo".
 * O app toca os dois ao mesmo tempo, em silêncio, e mostra o "falando" enquanto a voz do tutor sai.
 *
 * Para ligar um tutor: coloque public/tutores/<slug>/falando.mp4 e ouvindo.mp4 (quadrados, sem som,
 * começando e terminando no mesmo quadro) e adicione o slug abaixo.
 */
export const TUTORES_VIDEO: Record<string, { falando: string; ouvindo: string; poster: string }> = {
  caio: { falando: "/tutores/caio/falando.mp4", ouvindo: "/tutores/caio/ouvindo.mp4", poster: "/tutores/caio/video-poster.jpg" },
  bia: { falando: "/tutores/bia/falando.mp4", ouvindo: "/tutores/bia/ouvindo.mp4", poster: "/tutores/bia/video-poster.jpg" },
  ruby: { falando: "/tutores/ruby/falando.mp4", ouvindo: "/tutores/ruby/ouvindo.mp4", poster: "/tutores/ruby/video-poster.jpg" },
  sofia: { falando: "/tutores/sofia/falando.mp4", ouvindo: "/tutores/sofia/ouvindo.mp4", poster: "/tutores/sofia/video-poster.jpg" },
};

export const temVideo = (slug?: string): boolean => !!slug && slug in TUTORES_VIDEO;

/**
 * Decide se mostra o vídeo "falando": a voz está saindo agora (visema diferente de repouso)
 * ou saiu há pouco tempo (pausas curtas entre palavras não trocam o vídeo, que ficaria piscando).
 */
export function mostrarFalando(falando: boolean, ultimaVozMs: number | null, agoraMs: number, segurarMs = 450): boolean {
  if (!falando) return false;
  return ultimaVozMs !== null && agoraMs - ultimaVozMs <= segurarMs;
}
