"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/app", label: "Início", icone: "🏠" },
  { href: "/app/aulas", label: "Aulas", icone: "📚" },
  { href: "/app/revisao", label: "Revisão", icone: "🃏" },
  { href: "/app/progresso", label: "Progresso", icone: "📈" },
  { href: "/app/perfil", label: "Perfil", icone: "👤" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ABAS.map((a) => {
          const ativo = a.href === "/app" ? path === "/app" : path.startsWith(a.href);
          return (
            <li key={a.href}>
              <Link href={a.href} aria-current={ativo ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center text-xs font-bold ${ativo ? "text-brand" : "text-ink-soft"}`}>
                <span aria-hidden className="text-xl">{a.icone}</span>{a.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
