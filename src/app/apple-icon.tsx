import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0f7a5c" }}>
        <svg width="180" height="180" viewBox="0 0 512 512">
          <path d="M128 300c0-88 64-160 150-160 70 0 118 46 118 108 0 60-48 104-112 104h-46l-62 52v-60c-30-10-48-26-48-44z" fill="#fff" />
          <circle cx="300" cy="230" r="22" fill="#1d2433" />
          <path d="M370 236c34 4 52 22 52 44-28-6-46-14-60-28z" fill="#e2583e" />
        </svg>
      </div>
    ),
    size,
  );
}
