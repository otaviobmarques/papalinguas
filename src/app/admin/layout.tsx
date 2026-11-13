import Link from "next/link";
import { sessaoAdmin } from "@/lib/admin/auth";
import { PERFIL_NOME, pode } from "@/lib/admin/permissions";
import { TELAS_ADMIN } from "@/lib/admin/telas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Papalinguas · Admin", robots: { index: false } };

const NEGADO = {
  sem_login: "Entre com sua conta da equipe.",
  sem_acesso: "Sua conta não tem acesso ao painel.",
  precisa_2fa: "Confirme o código do autenticador (2FA) para continuar.",
  bloqueado: "Acesso bloqueado após tentativas erradas. Tente mais tarde.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await sessaoAdmin();
  if (s.modo === "negado") {
    return <main className="mx-auto max-w-md p-8 text-center"><h1 className="text-2xl font-extrabold">Painel restrito</h1><p className="mt-2 text-ink-soft">{NEGADO[s.motivo]}</p></main>;
  }
  const telas = TELAS_ADMIN.filter((t) => pode(s.perfil, t.requer));
  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-b border-line bg-surface md:min-h-dvh md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4">
          <Link href="/admin" className="font-extrabold text-brand">Papalinguas · Admin</Link>
        </div>
        <nav aria-label="Telas do painel" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {telas.map((t) => (
            <Link key={t.codigo} href={`/admin/${t.slug}`} className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-2">
              <span className="mr-2 text-xs text-ink-soft">{t.codigo}</span>{t.nome}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 text-sm">
          <span className="text-ink-soft">{s.modo === "demo" ? "Modo demonstração (dados fictícios)" : "Sessão expira em 8 h"}</span>
          <span className="font-semibold">{s.nome} · {PERFIL_NOME[s.perfil]}</span>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
