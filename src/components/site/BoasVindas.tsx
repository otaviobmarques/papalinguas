"use client";
import { useEffect, useRef, useState } from "react";
import Icone from "./Icone";

/**
 * Topo do site: a tutora dando as boas-vindas em vídeo.
 * Com o vídeo falado (Veo, com voz e boca sincronizada) em public/site/boas-vindas.mp4, ele toca sem som
 * com legenda, e o botão liga o som e recomeça. Sem ele, mostra o loop "falando" da tutora com a legenda.
 */
export const BOAS_VINDAS = {
  tutora: "Maya",
  papel: "tutora de inglês",
  /** vídeo falado com som; deixe null até o arquivo existir */
  video: "/site/boas-vindas.mp4" as string | null,
  reserva: "/tutores/maya/falando.mp4",
  /** voz da Maya usada com o vídeo reserva enquanto o vídeo falado não existe */
  voz: "/site/boas-vindas-voz.mp3",
  poster: "/site/boas-vindas-poster.jpg",
  legendas: ["Seja bem-vindo ao Papalinguas!", "Aqui você aprende inglês com naturalidade, 24 horas por dia."],
};

export default function BoasVindas() {
  const ref = useRef<HTMLVideoElement>(null);
  const [som, setSom] = useState(false);
  const [trecho, setTrecho] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const comVoz = !!BOAS_VINDAS.video;

  // legenda: a primeira frase no começo do vídeo, a segunda no resto
  useEffect(() => {
    const v = ref.current;
    const a = audio.current;
    if (!v) return;
    // com a voz separada tocando, a legenda segue o áudio; senão, segue o vídeo
    const tick = () => {
      const m = a && !a.paused ? a : v;
      setTrecho(m.duration && m.currentTime / m.duration > 0.32 ? 1 : 0);
    };
    const fim = () => setSom(false);
    v.addEventListener("timeupdate", tick);
    a?.addEventListener("timeupdate", tick);
    a?.addEventListener("ended", fim);
    return () => {
      v.removeEventListener("timeupdate", tick);
      a?.removeEventListener("timeupdate", tick);
      a?.removeEventListener("ended", fim);
    };
  }, []);

  function ouvir() {
    const v = ref.current;
    if (!v) return;
    const a = audio.current;
    if (som) {
      v.muted = true;
      a?.pause();
      setSom(false);
      return;
    }
    v.currentTime = 0;
    void v.play();
    if (comVoz) v.muted = false;
    else if (a) {
      a.currentTime = 0;
      void a.play();
    }
    setSom(true);
  }

  return (
    <figure className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)]">
      <div className="relative aspect-[4/5]">
        <video ref={ref} src={BOAS_VINDAS.video ?? BOAS_VINDAS.reserva} poster={BOAS_VINDAS.poster} autoPlay muted loop playsInline
          className="absolute inset-0 h-full w-full object-cover" aria-label={`${BOAS_VINDAS.tutora}, ${BOAS_VINDAS.papel}, dando as boas-vindas`} />
        {!comVoz && <audio ref={audio} src={BOAS_VINDAS.voz} preload="none" />}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,32,.25)_0%,transparent_25%,transparent_55%,rgba(11,18,32,.9)_100%)]" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#0b1220]/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
          <span className="size-2 rounded-full bg-brand shadow-[0_0_8px_#18a957]" /> {BOAS_VINDAS.tutora} · {BOAS_VINDAS.papel}
        </span>
        <figcaption className="absolute inset-x-4 bottom-4 space-y-3">
          <p key={trecho} className="anim-legenda rounded-2xl bg-[#0b1220]/80 px-4 py-3 text-center text-base font-bold leading-snug text-white backdrop-blur sm:text-lg">
            {BOAS_VINDAS.legendas[trecho]}
          </p>
          {(comVoz || BOAS_VINDAS.voz) && (
            <button type="button" onClick={ouvir} aria-pressed={som}
              className="mx-auto flex min-h-11 items-center gap-2 rounded-full bg-white/95 px-5 text-sm font-extrabold text-[#0b1220] shadow-lg transition hover:bg-white">
              <Icone nome={som ? "fechar" : "som"} className="size-4" /> {som ? "Tirar o som" : `Ouvir a ${BOAS_VINDAS.tutora}`}
            </button>
          )}
        </figcaption>
      </div>
    </figure>
  );
}
