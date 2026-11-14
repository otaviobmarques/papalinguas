"use client";
import { useEffect, useRef, useState } from "react";
import type { Visema } from "@/lib/domain/lipsync";
import type { EstadoVoz } from "@/components/TutorCharacter";
import { mostrarFalando, TUTORES_VIDEO } from "@/lib/tutores/videos";

interface Props {
  slug: string;
  nome: string;
  estado?: EstadoVoz;
  visema?: Visema;
  className?: string;
  enquadramento?: "busto" | "rosto" | "preencher";
}

/**
 * Tutor em vídeo: dois loops tocando juntos e em silêncio ("ouvindo" por baixo, "falando" por cima).
 * Enquanto a voz sai, o "falando" aparece com uma troca suave; nas pausas, volta ao "ouvindo".
 * Por serem vídeos de verdade, não há boca colada nem diferença de cor no rosto.
 */
export default function TutorVideo({ slug, nome, estado = "repouso", visema = 0, className = "", enquadramento = "busto" }: Props) {
  const v = TUTORES_VIDEO[slug];
  const ultimaVoz = useRef<number | null>(null);
  const visemaAtual = useRef<Visema>(0);
  const [falandoAgora, setFalandoAgora] = useState(false);
  const falando = estado === "falando";

  // reavalia a cada 100 ms: a troca para "ouvindo" acontece só depois de uma pausa de verdade
  useEffect(() => {
    if (!falando) {
      setFalandoAgora(false);
      return;
    }
    const id = setInterval(() => {
      const agora = performance.now();
      if (visemaAtual.current !== 0) ultimaVoz.current = agora; // vogal longa: a mesma boca, ainda falando
      setFalandoAgora(mostrarFalando(true, ultimaVoz.current, agora));
    }, 100);
    return () => clearInterval(id);
  }, [falando]);
  useEffect(() => {
    visemaAtual.current = falando ? visema : 0;
    if (!falando || visema === 0) return;
    ultimaVoz.current = performance.now();
    setFalandoAgora(true);
  }, [falando, visema]);

  // desempenho: o "ouvindo" só toca enquanto o tutor está na tela; o "falando" só carrega quando ele fala
  const caixa = useRef<HTMLDivElement>(null);
  const vOuvindo = useRef<HTMLVideoElement>(null);
  const vFalando = useRef<HTMLVideoElement>(null);
  const [visivel, setVisivel] = useState(true);
  const [usouFala, setUsouFala] = useState(enquadramento === "preencher"); // na aula, já carrega o "falando"
  useEffect(() => {
    const el = caixa.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (falando) setUsouFala(true);
  }, [falando]);
  useEffect(() => {
    const o = vOuvindo.current;
    if (!o) return;
    if (visivel) void o.play().catch(() => {});
    else o.pause();
  }, [visivel]);
  useEffect(() => {
    const f = vFalando.current;
    if (!f || !usouFala) return;
    if (visivel && falando) void f.play().catch(() => {});
    else if (!falando) f.pause();
  }, [visivel, falando, usouFala]);

  if (!v) return null;
  const zoom = enquadramento === "rosto" ? "scale-[1.9] origin-[50%_42%]" : "";
  const comum = "absolute inset-0 h-full w-full select-none object-cover";

  return (
    <div ref={caixa} className={`relative flex items-center justify-center ${className}`} role="img" aria-label={`${nome}, personagem de IA${falando ? ", falando" : ""}`}>
      <div className={enquadramento === "preencher" ? "absolute left-1/2 top-0 aspect-square h-full -translate-x-1/2" : `relative aspect-square h-full max-h-full max-w-full overflow-hidden ${enquadramento === "busto" ? "rounded-3xl" : ""}`}>
        <div className={`absolute inset-0 ${zoom}`}>
          <video ref={vOuvindo} src={v.ouvindo} poster={v.poster} className={comum} loop muted playsInline preload="metadata" aria-hidden />
          {usouFala && (
            <video ref={vFalando} src={v.falando} className={`${comum} transition-opacity duration-150 ease-out`} style={{ opacity: falandoAgora ? 1 : 0 }}
              loop muted playsInline preload="auto" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
