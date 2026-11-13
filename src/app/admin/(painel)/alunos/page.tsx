import Link from "next/link";
import { redirect } from "next/navigation";
import { sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { mascararEmail } from "@/lib/domain/cortesia";
import { CortesiaForm, EncerrarCortesia, NovoAcesso } from "./CortesiaForm";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  pendente: "aguardando pagamento", em_garantia: "em garantia", ativa: "ativa", inadimplente: "inadimplente", cancelada: "cancelada", expirada: "expirada",
};

/** P2 · Alunos (lista + cadastro cortesia). Busca, filtros e ficha completa (P3) vêm na sprint 5. */
export default async function Alunos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "ver_ficha")) redirect("/admin");
  const { q } = await searchParams;

  type Linha = { id: string; email: string; name: string | null; status: string; created_at: string;
    subscriptions: { id: string; status: string; gateway: string; current_period_end: string | null; plans: { name: string } | null }[] };
  let alunos: Linha[] = [];
  if (isSupabaseConfigured()) {
    let consulta = supabaseAdmin().from("users")
      .select("id, email, name, status, created_at, subscriptions(id, status, gateway, current_period_end, created_at, plans!subscriptions_plan_id_fkey(name))")
      .order("created_at", { ascending: false }).limit(50);
    // valores entre aspas: e-mails têm pontos, que o filtro "or" usaria como separador
    const termo = (q ?? "").replace(/[%,()"\\]/g, "").trim();
    if (termo) consulta = consulta.or(`email.ilike."%${termo}%",name.ilike."%${termo}%"`);
    const { data } = await consulta;
    alunos = (data ?? []) as unknown as Linha[];
  }

  return (
    <main className="max-w-5xl">
      <h1 className="text-2xl font-extrabold">P2 · Alunos</h1>
      {pode(s.perfil, "conceder_cortesia") && <div className="mt-4"><CortesiaForm /></div>}

      <form className="mt-6 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar por nome ou e-mail" aria-label="Buscar aluno" className="min-h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm" />
        <button className="btn-ghost min-h-11 py-2 text-sm">Buscar</button>
      </form>

      <div className="card mt-3 overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr><th className="p-3">Aluno</th><th className="p-3">Plano</th><th className="p-3">Situação</th><th className="p-3">Até</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {alunos.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-ink-soft">Nenhum aluno encontrado.</td></tr>}
            {alunos.map((a) => {
              const sub = [...(a.subscriptions ?? [])].sort((x, y) => (y.current_period_end ?? "").localeCompare(x.current_period_end ?? ""))[0];
              return (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/alunos/${a.id}`} className="font-semibold text-ink underline-offset-4 hover:underline">{a.name ?? "—"}</Link>
                    {a.status !== "ativo" && <span className="ml-2 rounded-full border border-danger/40 px-2 py-0.5 text-[11px] font-bold text-danger">{a.status === "suspenso" ? "bloqueado" : a.status.replace("_", " ")}</span>}
                    <p className="text-xs text-ink-soft">{mascararEmail(a.email)}</p>
                  </td>
                  <td className="p-3">{sub?.plans?.name ?? "—"}{sub?.gateway === "cortesia" && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">cortesia</span>}</td>
                  <td className="p-3">{sub ? STATUS[sub.status] ?? sub.status : "sem assinatura"}</td>
                  <td className="p-3">{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="p-3">{sub?.gateway === "cortesia" && sub.status === "ativa" && pode(s.perfil, "conceder_cortesia") && (
                    <div className="flex min-w-48 flex-col items-start gap-2"><NovoAcesso userId={a.id} /><EncerrarCortesia assinaturaId={sub.id} /></div>
                  )}
                    <Link href={`/admin/alunos/${a.id}`} className="mt-2 inline-block text-xs font-semibold text-ink-soft underline">Abrir ficha</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
