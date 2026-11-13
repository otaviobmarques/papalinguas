import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.titulo, template: "%s · Papalinguas" },
  description: SITE.descricao,
  applicationName: SITE.nome,
  keywords: ["aprender inglês", "conversação em inglês", "tutor de inglês", "aprender espanhol", "português para estrangeiros", "aula de inglês por voz", "inglês com IA", "app de idiomas", "treinar entrevista em inglês"],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Papalinguas", statusBarStyle: "black-translucent" },
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE.nome, url: "/", title: SITE.titulo, description: SITE.descricao },
  twitter: { card: "summary_large_image", title: SITE.titulo, description: SITE.descricao },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} tema-escuro fundo-app antialiased`}>{children}</body>
    </html>
  );
}
