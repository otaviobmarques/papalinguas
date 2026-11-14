"use client";
import { useEffect, useState } from "react";
import type { Visema } from "@/lib/domain/lipsync";
import type { EstadoVoz, Expressao } from "@/components/TutorCharacter";
import { fotoDoTutor, type Regiao } from "@/lib/tutores/fotos";

interface Props {
  slug: string;
  nome: string;
  estado?: EstadoVoz;
  visema?: Visema;
  expressao?: Expressao;
  className?: string;
  /** Retrato quadrado (padrão) ou recorte do rosto, para avatares pequenos */
  enquadramento?: "busto" | "rosto" | "preencher";
  /** Controle externo do piscar (vídeos Remotion); sem ele, o piscar é aleatório */
  piscando?: boolean;
}

/**
 * Troca de boca sem "fantasma": a nova entra por cima (25 ms) enquanto a anterior continua opaca
 * por baixo por mais 35 ms, então o retrato nunca aparece no meio da troca.
 * Só na volta ao repouso a boca some aos poucos (o destino é o próprio retrato).
 */
function estiloBoca(v: number, ativo: number): React.CSSProperties {
  if (v === ativo) return { opacity: 1, zIndex: 2, transition: "opacity 25ms ease-out" };
  return { opacity: 0, zIndex: 1, transition: ativo === 0 ? "opacity 50ms ease-out" : "opacity 0s linear 35ms" };
}

const pos = (r: Regiao) => ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` });

/**
 * Tutor em foto (Manual 3.3, mesma interface do personagem Rive/SVG).
 * Só a região da boca e dos olhos troca, sobre um retrato fixo: cabeça, cabelo e luz não tremem.
 * As bocas trocam sem mostrar o retrato no meio da troca (ver estiloBoca); o piscar é aleatório (2,5 a 6 s), como o de uma pessoa.
 */
export default function TutorFoto({ slug, nome, estado = "repouso", visema = 0, expressao = "neutra", className = "", enquadramento = "busto", piscando: piscarExterno }: Props) {
  const f = fotoDoTutor(slug);
  const [piscarInterno, setPiscando] = useState(false);
  const controlado = piscarExterno !== undefined;
  const piscando = controlado ? piscarExterno : piscarInterno;

  useEffect(() => {
    if (controlado || !f?.animado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    const agendar = () => {
      t = setTimeout(() => {
        setPiscando(true);
        t = setTimeout(() => {
          setPiscando(false);
          // às vezes pisca duas vezes seguidas
          if (Math.random() < 0.15) t = setTimeout(() => { setPiscando(true); t = setTimeout(() => { setPiscando(false); agendar(); }, 120); }, 180);
          else agendar();
        }, 130);
      }, 2500 + Math.random() * 3500);
    };
    agendar();
    return () => clearTimeout(t);
  }, [f?.animado, controlado]);

  if (!f) return null;
  const falando = estado === "falando";
  // expressão só fora da fala: a boca da fala é recortada do rosto neutro
  const exp = !falando && f.expressoes ? (expressao === "sorriso" || expressao === "comemoracao" ? f.expressoes.feliz : expressao === "duvida" ? f.expressoes.surpresa : undefined) : undefined;
  const zoom = enquadramento === "rosto" ? "scale-[1.9] origin-[50%_42%]" : "";

  return (
    <div className={`relative flex items-center justify-center ${className}`} role="img" aria-label={`${nome}, personagem de IA${falando ? ", falando" : ""}`}>
      <div className={enquadramento === "preencher" ? "absolute left-1/2 top-0 aspect-square h-full -translate-x-1/2" : `relative aspect-square h-full max-h-full max-w-full overflow-hidden ${enquadramento === "busto" ? "rounded-3xl" : ""}`}>
        <div className={`absolute inset-0 ${zoom}`}>
        <div className={`absolute inset-0 ${falando ? "anim-fala" : estado === "ouvindo" ? "anim-ouvir" : "anim-respirar"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.base} alt="" className="absolute inset-0 h-full w-full select-none object-cover" draggable={false} />
          {f.animado && f.boca && (
            <>
              {f.expressoes && f.rosto && (["feliz", "surpresa"] as const).map((e) => f.expressoes?.[e] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={e} src={f.expressoes[e]} alt="" draggable={false} className="absolute select-none transition-opacity duration-300"
                  style={{ ...pos(f.rosto!), opacity: exp === f.expressoes[e] ? 1 : 0 }} />
              ))}
              {([1, 2, 3, 4, 5, 6] as const).map((v) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={v} src={`/tutores/${slug}/boca-${v}.webp`} alt="" draggable={false} className="absolute select-none"
                  style={{ ...pos(f.boca!), ...estiloBoca(v, falando ? visema : 0) }} />
              ))}
              {f.olhos && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/tutores/${slug}/olhos.webp`} alt="" draggable={false} className="absolute select-none transition-opacity duration-[50ms]"
                  style={{ ...pos(f.olhos), opacity: piscando ? 1 : 0 }} />
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
