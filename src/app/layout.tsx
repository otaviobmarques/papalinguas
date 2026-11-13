import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.titulo, template: "%s · Papalinguas" },
  description: SITE.descricao,
  applicationName: SITE.nome,
  keywords: ["aprender inglês", "conversação em inglês", "tutor de inglês", "aprender espanhol", "português para estrangeiros", "aula de inglês por voz", "inglês com IA", "app de idiomas", "treinar entrevista em inglês"],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Papalinguas", statusBarStyle: "default" },
  openGraph: { type: "website", locale: "pt_BR", siteName: SITE.nome, url: "/", title: SITE.titulo, description: SITE.descricao },
  twitter: { card: "summary_large_image", title: SITE.titulo, description: SITE.descricao },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#12151c" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${nunito.variable} antialiased`}>{children}</body>
    </html>
  );
}
