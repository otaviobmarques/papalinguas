"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/marca/Logo";
import Icone from "./Icone";

const LINKS = [
  ["#como-funciona", "Como funciona"],
  ["#tutores", "Tutores"],
  ["#planos", "Planos"],
  ["#perguntas", "Perguntas"],
] as const;

/** Cabeçalho do site: transparente no topo, vidro escuro ao rolar; menu próprio no celular. */
export default function SiteHeader({ ancoras = true }: { ancoras?: boolean }) {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const f = () => setRolou(window.scrollY > 12);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const pref = ancoras ? "" : "/";

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${rolou || aberto ? "border-b border-white/10 bg-[#0b1220]/80 backdrop-blur-xl" : "border-b border-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px]">
        <Link href="/" aria-label="Papalinguas, página inicial" className="rounded-xl"><Logo tamanho="sm" /></Link>
        <nav aria-label="Seções" className="hidden items-center gap-8 text-sm font-semibold text-ink-soft md:flex">
          {LINKS.map(([h, t]) => <a key={h} href={pref + h} className="transition hover:text-ink">{t}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/comecar/conta?entrar=1" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-ink-soft hover:text-ink sm:inline-flex">Entrar</Link>
          <Link href="/comecar" className="btn-primary min-h-11 rounded-full px-5 py-2 text-sm">Teste grátis</Link>
          <button type="button" className="grid size-11 place-items-center rounded-full text-ink md:hidden" aria-label={aberto ? "Fechar menu" : "Abrir menu"} aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
            <Icone nome={aberto ? "fechar" : "menu"} />
          </button>
        </div>
      </div>
      {aberto && (
        <nav aria-label="Seções" className="border-t border-white/10 px-4 pb-4 md:hidden">
          {LINKS.map(([h, t]) => <a key={h} href={pref + h} onClick={() => setAberto(false)} className="flex min-h-12 items-center border-b border-white/5 font-semibold">{t}</a>)}
          <Link href="/comecar/conta?entrar=1" className="flex min-h-12 items-center font-semibold">Entrar</Link>
        </nav>
      )}
    </header>
  );
}
