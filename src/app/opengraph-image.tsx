import { ImageResponse } from "next/og";

/** Banner de prévia de link (WhatsApp, redes, Google): 1200×630. */
export const alt = "Papalinguas: converse com seu tutor de IA em inglês, espanhol ou português";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Tutor({ pele, cabelo, roupa, x }: { pele: string; cabelo: string; roupa: string; x: number }) {
  return (
    <svg width="230" height="265" viewBox="0 0 200 230" style={{ position: "absolute", left: x, bottom: 0 }}>
      <path d="M34 230 Q36 182 100 176 Q164 182 166 230 Z" fill={roupa} />
      <rect x="88" y="150" width="24" height="30" rx="10" fill={pele} />
      <ellipse cx="100" cy="104" rx="52" ry="60" fill={pele} />
      <path d="M46 96 Q44 40 100 38 Q156 40 154 96 Q150 70 128 64 Q100 74 70 62 Q52 70 46 96 Z" fill={cabelo} />
      <ellipse cx="80" cy="100" rx="5.5" ry="6.5" fill="#1d2433" />
      <ellipse cx="120" cy="100" rx="5.5" ry="6.5" fill="#1d2433" />
      <ellipse cx="70" cy="126" rx="9" ry="5" fill="#e2583e" opacity="0.35" />
      <ellipse cx="130" cy="126" rx="9" ry="5" fill="#e2583e" opacity="0.35" />
      <path d="M86 138 Q100 154 114 138 Q100 146 86 138 Z" fill="#7a2b25" />
    </svg>
  );
}

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fbf8f3", fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 560, height: 560, borderRadius: 9999, background: "#fde9e4", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "70px 0 70px 80px", width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 800, color: "#0f7a5c" }}>
            <svg width="64" height="64" viewBox="0 0 512 512">
              <rect width="512" height="512" rx="112" fill="#0f7a5c" />
              <path d="M128 300c0-88 64-160 150-160 70 0 118 46 118 108 0 60-48 104-112 104h-46l-62 52v-60c-30-10-48-26-48-44z" fill="#fff" />
              <circle cx="300" cy="230" r="22" fill="#1d2433" />
              <path d="M370 236c34 4 52 22 52 44-28-6-46-14-60-28z" fill="#e2583e" />
            </svg>
            Papalinguas
          </div>
          <div style={{ marginTop: 40, fontSize: 64, fontWeight: 800, lineHeight: 1.1, color: "#1d2433", display: "flex" }}>
            Fale um novo idioma conversando com seu tutor de IA
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#5a6275", display: "flex" }}>Inglês · Espanhol · Português · Teste de nível grátis</div>
        </div>
        <div style={{ position: "absolute", right: 40, bottom: 0, width: 470, height: 520, display: "flex" }}>
          <Tutor pele="#7a4a2e" cabelo="#1a1110" roupa="#6b4fbb" x={0} />
          <Tutor pele="#f1c9a5" cabelo="#3b2416" roupa="#e2583e" x={210} />
        </div>
      </div>
    ),
    size,
  );
}
