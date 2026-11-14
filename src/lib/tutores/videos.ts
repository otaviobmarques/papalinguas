/**
 * Tutores com vídeos em loop (gerados por IA a partir do retrato): um "falando" e um "ouvindo".
 * O app toca os dois ao mesmo tempo, em silêncio, e mostra o "falando" enquanto a voz do tutor sai.
 *
 * Para ligar um tutor: coloque public/tutores/<slug>/falando.mp4 e ouvindo.mp4 (quadrados, sem som,
 * começando e terminando no mesmo quadro) e adicione o slug abaixo.
 */
export const TUTORES_VIDEO: Record<string, { falando: string; ouvindo: string; poster: string }> = {
  mei: { falando: "/tutores/mei/falando.mp4", ouvindo: "/tutores/mei/ouvindo.mp4", poster: "/tutores/mei/video-poster.jpg" },
  maya: { falando: "/tutores/maya/falando.mp4", ouvindo: "/tutores/maya/ouvindo.mp4", poster: "/tutores/maya/video-poster.jpg" },
  mateo: { falando: "/tutores/mateo/falando.mp4", ouvindo: "/tutores/mateo/ouvindo.mp4", poster: "/tutores/mateo/video-poster.jpg" },
  marco: { falando: "/tutores/marco/falando.mp4", ouvindo: "/tutores/marco/ouvindo.mp4", poster: "/tutores/marco/video-poster.jpg" },
  lukas: { falando: "/tutores/lukas/falando.mp4", ouvindo: "/tutores/lukas/ouvindo.mp4", poster: "/tutores/lukas/video-poster.jpg" },
  lucia: { falando: "/tutores/lucia/falando.mp4", ouvindo: "/tutores/lucia/ouvindo.mp4", poster: "/tutores/lucia/video-poster.jpg" },
  lena: { falando: "/tutores/lena/falando.mp4", ouvindo: "/tutores/lena/ouvindo.mp4", poster: "/tutores/lena/video-poster.jpg" },
  kenji: { falando: "/tutores/kenji/falando.mp4", ouvindo: "/tutores/kenji/ouvindo.mp4", poster: "/tutores/kenji/video-poster.jpg" },
  julien: { falando: "/tutores/julien/falando.mp4", ouvindo: "/tutores/julien/ouvindo.mp4", poster: "/tutores/julien/video-poster.jpg" },
  helena: { falando: "/tutores/helena/falando.mp4", ouvindo: "/tutores/helena/ouvindo.mp4", poster: "/tutores/helena/video-poster.jpg" },
  hao: { falando: "/tutores/hao/falando.mp4", ouvindo: "/tutores/hao/ouvindo.mp4", poster: "/tutores/hao/video-poster.jpg" },
  grace: { falando: "/tutores/grace/falando.mp4", ouvindo: "/tutores/grace/ouvindo.mp4", poster: "/tutores/grace/video-poster.jpg" },
  camille: { falando: "/tutores/camille/falando.mp4", ouvindo: "/tutores/camille/ouvindo.mp4", poster: "/tutores/camille/video-poster.jpg" },
  giulia: { falando: "/tutores/giulia/falando.mp4", ouvindo: "/tutores/giulia/ouvindo.mp4", poster: "/tutores/giulia/video-poster.jpg" },
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
