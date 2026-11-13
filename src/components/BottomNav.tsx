"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icone from "@/components/Icone";

const ABAS = [
  { href: "/app", label: "Início", icone: "inicio" },
  { href: "/app/aulas", label: "Aulas", icone: "aulas" },
  { href: "/app/revisao", label: "Revisão", icone: "cartoes" },
  { href: "/app/progresso", label: "Progresso", icone: "progresso" },
  { href: "/app/perfil", label: "Perfil", icone: "perfil" },
];

/** Navegação principal: barra de vidro flutuante, com indicador na aba ativa. */
export default function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <ul className="mx-auto grid max-w-md grid-cols-5 rounded-[1.75rem] border border-white/10 bg-[#0b1220]/75 p-1.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,.8)] backdrop-blur-xl">
        {ABAS.map((a) => {
          const ativo = a.href === "/app" ? path === "/app" : path.startsWith(a.href);
          return (
            <li key={a.href}>
              <Link href={a.href} aria-current={ativo ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[1.4rem] text-[11px] font-bold transition ${ativo ? "bg-brand/15 text-[#5ee29b]" : "text-ink-soft hover:text-ink"}`}>
                <Icone nome={a.icone} className="size-[22px]" />
                {a.label}
                {ativo && <span className="absolute top-1 h-1 w-1 rounded-full bg-brand shadow-[0_0_8px_#18a957]" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
