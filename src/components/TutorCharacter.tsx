"use client";
import { useEffect, useState } from "react";
import type { Visema } from "@/lib/domain/lipsync";
import type { TutorVisual } from "@/lib/demo/data";
import TutorFoto from "@/components/TutorFoto";
import { temFotoAnimada } from "@/lib/tutores/fotos";
import { temRive } from "@/lib/tutores/rive";
import dynamic from "next/dynamic";

// o motor do Rive só é baixado quando algum tutor usa um arquivo .riv
const TutorRive = dynamic(() => import("@/components/rive/TutorRive"), { ssr: false });

/**
 * Personagem do tutor (Manual 3.3 / M23).
 * Mesma interface da máquina de estados Rive: estado, visema (0–6) e expressão.
 * Este SVG é o substituto até a entrega dos arquivos .riv do ilustrador; trocar
 * a implementação aqui não muda nenhuma tela.
 */
export type EstadoVoz = "repouso" | "ouvindo" | "pensando" | "falando";
export type Expressao = "neutra" | "sorriso" | "duvida" | "comemoracao";

interface Props {
  /** Com slug de um tutor que tem fotos completas, mostra a foto animada (TutorFoto) */
  slug?: string;
  /** Avatar pequeno e redondo: aproxima no rosto (só nas fotos) */
  enquadramento?: "busto" | "rosto" | "preencher";
  visual: TutorVisual;
  nome: string;
  estado?: EstadoVoz;
  visema?: Visema;
  expressao?: Expressao;
  acenando?: boolean;
  className?: string;
}

const BOCAS: Record<Visema, (f: string) => React.ReactNode> = {
  0: () => <path d="M89 141 Q100 146 111 141" fill="none" stroke="#5b2a22" strokeWidth="3" strokeLinecap="round" />,
  1: (f) => <ellipse cx="100" cy="143" rx="10" ry="9" fill={f} />,
  2: (f) => (
    <g>
      <ellipse cx="100" cy="142" rx="13" ry="4.5" fill={f} />
      <rect x="91" y="138" width="18" height="3" rx="1" fill="#fff" />
    </g>
  ),
  3: (f) => <ellipse cx="100" cy="143" rx="7.5" ry="8.5" fill={f} />,
  4: (f) => <ellipse cx="100" cy="143" rx="4.5" ry="5" fill={f} />,
  5: () => <path d="M90 142 L110 142" stroke="#5b2a22" strokeWidth="4" strokeLinecap="round" />,
  6: (f) => (
    <g>
      <ellipse cx="100" cy="143" rx="11" ry="3.5" fill={f} />
      <rect x="93" y="139" width="14" height="3" rx="1" fill="#fff" />
    </g>
  ),
};

function Cabelo({ v }: { v: TutorVisual }) {
  const c = v.cabelo;
  switch (v.estiloCabelo) {
    case "longo":
      return (
        <g fill={c}>
          <path d="M46 100 Q44 40 100 36 Q156 40 154 100 L160 190 Q130 200 128 160 L128 70 Q100 56 72 70 L72 160 Q70 200 40 190 Z" />
        </g>
      );
    case "cacheado":
      return (
        <g fill={c}>
          {[[60, 62], [80, 46], [100, 40], [120, 46], [140, 62], [52, 84], [148, 84], [50, 106], [150, 106]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="18" />
          ))}
        </g>
      );
    case "coque":
      return (
        <g fill={c}>
          <circle cx="100" cy="30" r="17" />
          <path d="M48 96 Q48 44 100 42 Q152 44 152 96 Q140 66 100 64 Q60 66 48 96 Z" />
        </g>
      );
    case "raspado":
      return <path d="M50 88 Q52 44 100 42 Q148 44 150 88 Q138 62 100 60 Q62 62 50 88 Z" fill={c} opacity="0.85" />;
    default:
      return <path d="M46 96 Q44 40 100 38 Q156 40 154 96 Q150 70 128 64 Q100 74 70 62 Q52 70 46 96 Z" fill={c} />;
  }
}

export default function TutorCharacter(props: Props) {
  const { slug, nome, estado, visema, expressao, acenando, className, enquadramento } = props;
  if (temRive(slug)) {
    return <TutorRive slug={slug!} nome={nome} estado={estado} visema={visema} expressao={expressao} acenando={acenando} className={className} enquadramento={enquadramento} />;
  }
  if (temFotoAnimada(slug)) {
    return <TutorFoto slug={slug!} nome={nome} estado={estado} visema={visema} expressao={acenando ? "sorriso" : expressao} className={className} enquadramento={enquadramento} />;
  }
  return <TutorDesenho {...props} />;
}

/** Personagem em SVG: reserva para tutores sem fotos completas. */
function TutorDesenho({ visual, nome, estado = "repouso", visema = 0, expressao = "neutra", acenando, className }: Props) {
  const [piscando, setPiscando] = useState(false);

  // Piscar automático em intervalos irregulares
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const agenda = () => {
      t = setTimeout(() => {
        setPiscando(true);
        setTimeout(() => setPiscando(false), 140);
        agenda();
      }, 2500 + Math.random() * 3000);
    };
    agenda();
    return () => clearTimeout(t);
  }, []);

  const corBoca = "#7a2b25";
  const falando = estado === "falando";
  const boca = falando ? visema : expressao === "sorriso" || expressao === "comemoracao" ? null : visema;
  const olhoY = piscando ? 0.12 : 1;
  const sobrancelha =
    estado === "pensando" ? { l: "M70 82 Q80 74 90 80", r: "M110 76 Q120 70 130 76" }
    : expressao === "duvida" ? { l: "M70 80 Q80 76 90 82", r: "M110 78 Q120 72 130 78" }
    : expressao === "comemoracao" ? { l: "M70 78 Q80 70 90 78", r: "M110 78 Q120 70 130 78" }
    : { l: "M70 82 Q80 77 90 82", r: "M110 82 Q120 77 130 82" };

  return (
    <svg
      viewBox="0 0 200 230"
      role="img"
      aria-label={`${nome}, tutor de IA, ${estado}`}
      className={className}
    >
      <g className="anim-breathe">
        {/* corpo */}
        <path d="M34 230 Q36 182 100 176 Q164 182 166 230 Z" fill={visual.roupa} />
        <rect x="88" y="150" width="24" height="30" rx="10" fill={visual.pele} />
        {visual.estiloCabelo === "longo" && <Cabelo v={visual} />}
        {/* cabeça */}
        <ellipse cx="100" cy="104" rx="52" ry="60" fill={visual.pele} />
        <ellipse cx="48" cy="110" rx="8" ry="12" fill={visual.pele} />
        <ellipse cx="152" cy="110" rx="8" ry="12" fill={visual.pele} />
        {visual.estiloCabelo !== "longo" && <Cabelo v={visual} />}
        {visual.estiloCabelo === "longo" && <path d="M48 96 Q48 44 100 40 Q152 44 152 96 Q148 66 120 60 Q96 72 64 64 Q50 74 48 96 Z" fill={visual.cabelo} />}
        {visual.barba && <path d="M56 120 Q60 172 100 174 Q140 172 144 120 Q132 150 100 152 Q68 150 56 120 Z" fill={visual.cabelo} opacity="0.9" />}
        {/* bochechas */}
        <ellipse cx="70" cy="126" rx="9" ry="5" fill="#e2583e" opacity={expressao === "sorriso" || expressao === "comemoracao" ? 0.35 : 0.18} />
        <ellipse cx="130" cy="126" rx="9" ry="5" fill="#e2583e" opacity={expressao === "sorriso" || expressao === "comemoracao" ? 0.35 : 0.18} />
        {/* olhos */}
        <g transform={`translate(0 100) scale(1 ${olhoY}) translate(0 -100)`} fill="#1d2433">
          <ellipse cx="80" cy="100" rx="5.5" ry="6.5" />
          <ellipse cx="120" cy="100" rx="5.5" ry="6.5" />
          <circle cx="82" cy="98" r="1.8" fill="#fff" />
          <circle cx="122" cy="98" r="1.8" fill="#fff" />
        </g>
        {visual.oculos && (
          <g fill="none" stroke="#1d2433" strokeWidth="2.5">
            <circle cx="80" cy="100" r="13" />
            <circle cx="120" cy="100" r="13" />
            <path d="M93 100 L107 100" />
          </g>
        )}
        <g fill="none" stroke={visual.cabelo} strokeWidth="3.5" strokeLinecap="round">
          <path d={sobrancelha.l} />
          <path d={sobrancelha.r} />
        </g>
        {/* nariz */}
        <path d="M100 108 Q96 120 101 123" fill="none" stroke="#00000033" strokeWidth="2.5" strokeLinecap="round" />
        {/* boca */}
        {boca === null ? (
          <path d="M86 138 Q100 154 114 138 Q100 146 86 138 Z" fill={corBoca} />
        ) : (
          BOCAS[boca](corBoca)
        )}
      </g>
      {acenando && (
        <g className="anim-wave">
          <path d="M158 230 L166 176" stroke={visual.roupa} strokeWidth="18" strokeLinecap="round" />
          <circle cx="168" cy="166" r="12" fill={visual.pele} />
        </g>
      )}
    </svg>
  );
}
