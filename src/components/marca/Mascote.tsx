import { useId } from "react";
import { COR } from "@/lib/marca";

/**
 * Mascote: papagaio-verdadeiro geométrico (busto), com piscar e balanço suaves em CSS.
 * `pose`: "normal" ou "acenando" (asa levantada, para boas-vindas e comemorações).
 */
export default function Mascote({ className = "", pose = "normal", titulo }: { className?: string; pose?: "normal" | "acenando"; titulo?: string }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = COR;
  return (
    <svg viewBox="0 0 200 240" className={`mascote ${className}`} role={titulo ? "img" : undefined} aria-label={titulo} aria-hidden={titulo ? undefined : true}>
      <defs>
        <clipPath id={`cab${u}`}><circle cx="96" cy="86" r="62" /></clipPath>
        <clipPath id={`cor${u}`}><path d="M30 240 C30 150 62 120 100 120 C150 120 176 160 176 240 Z" /></clipPath>
      </defs>
      <path d="M30 240 C30 150 62 120 100 120 C150 120 176 160 176 240 Z" fill={c.verde} />
      <g clipPath={`url(#cor${u})`}>
        <path d="M60 170 Q100 196 140 170 L140 240 L60 240 Z" fill="#22C06A" opacity=".55" />
        {pose === "normal" && (
          <>
            <path d="M120 150 C170 150 190 200 182 240 L120 240 Z" fill={c.verdeMata} />
            <path d="M128 150 C150 146 168 160 170 176 C150 172 136 166 128 150 Z" fill={c.vermelho} />
          </>
        )}
      </g>
      {pose === "acenando" && (
        <g className="mascote-asa">
          <path d="M150 150 C176 130 196 100 192 70 C178 84 160 110 136 140 Z" fill={c.verdeMata} />
          <path d="M192 70 C186 80 180 88 172 96 C176 84 182 76 192 70 Z" fill={c.vermelho} />
        </g>
      )}
      <g className="mascote-cabeca">
        <circle cx="96" cy="86" r="62" fill={c.verde} />
        <g clipPath={`url(#cab${u})`}>
          <ellipse cx="114" cy="26" rx="50" ry="26" fill={c.azul} />
          <ellipse cx="128" cy="80" rx="32" ry="28" fill={c.amarelo} />
        </g>
        <path d="M136 56 C166 52 190 72 188 102 C187 116 178 124 168 120 C172 106 164 92 146 92 Z" fill={c.bico} />
        <path d="M142 98 C156 98 166 106 164 116 C156 124 146 120 138 112 Z" fill={c.bico2} />
        <g className="mascote-olho">
          <circle cx="124" cy="74" r="12" fill="#fff" />
          <circle cx="127" cy="74" r="6.5" fill={c.noite} />
          <circle cx="129" cy="71" r="2" fill="#fff" />
        </g>
        <path d="M70 60 Q80 52 92 58" stroke={c.verdeMata} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".5" />
      </g>
    </svg>
  );
}
