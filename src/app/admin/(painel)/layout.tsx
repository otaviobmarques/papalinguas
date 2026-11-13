import Link from "next/link";
import { redirect } from "next/navigation";
import { sair, sessaoAdmin } from "@/lib/admin/auth";
import { PERFIL_NOME, pode } from "@/lib/admin/permissions";
import { TELAS_ADMIN } from "@/lib/admin/telas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Papalinguas · Admin", robots: { index: false } };

async function acaoSair() {
  "use server";
  await sair();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await sessaoAdmin();
  if (!s) redirect("/admin/login");
  const telas = TELAS_ADMIN.filter((t) => pode(s.perfil, t.requer));
  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-b border-line bg-surface md:min-h-dvh md:w-64 md:border-b-0 md:border-r">
        <div className="p-4"><Link href="/admin" className="font-extrabold text-brand">Papalinguas · Admin</Link></div>
        <nav aria-label="Menu do painel" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {telas.map((t) => (
            <Link key={t.codigo} href={`/admin/${t.slug}`} className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-2">
              <span className="mr-2 text-xs text-ink-soft">{t.codigo}</span>{t.nome}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm">
          <span className="text-ink-soft">Sessão expira em 8 h</span>
          <form action={acaoSair} className="flex items-center gap-3">
            <span className="font-semibold">{s.nome} · {PERFIL_NOME[s.perfil]}</span>
            <button className="min-h-11 rounded-xl border border-line px-3 font-semibold hover:bg-surface-2">Sair</button>
          </form>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
