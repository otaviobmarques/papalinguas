import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { BloqueioAluno, EditarAlunoForm, ExcluirAluno } from "./FichaForms";

export const dynamic = "force-dynamic";

const SITUACAO: Record<string, [string, string]> = {
  ativo: ["ativo", "border-brand/40 bg-brand/10 text-[#5ee29b]"],
  suspenso: ["bloqueado", "border-danger/40 bg-danger/10 text-danger"],
  banido: ["banido", "border-danger/40 bg-danger/10 text-danger"],
  em_exclusao: ["em exclusão", "border-warn/40 bg-warn/10 text-warn"],
  excluido: ["excluído", "border-line text-ink-soft"],
};
const data = (s?: string | null) => (s ? new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "—");

/** P3 · Ficha do aluno: dados, edição, bloqueio e exclusão. */
export default async function FichaAluno({ params }: { params: Promise<{ id: string }> }) {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "ver_ficha")) redirect("/admin");
  const { id } = await params;
  if (!isSupabaseConfigured() || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sb = supabaseAdmin();
  const { data: u, error: erroConsulta } = await sb.from("users")
    .select("id, email, name, status, created_at, subscriptions(id, status, gateway, current_period_end, plans!subscriptions_plan_id_fkey(name)), profiles(target_language, level)")
    .eq("id", id).maybeSingle();
  if (erroConsulta) {
    return (
      <main className="max-w-3xl">
        <Link href="/admin/alunos" className="text-sm font-semibold text-ink-soft hover:text-ink">← Alunos</Link>
        <p role="alert" className="card mt-4 border-danger/40 text-danger">Não foi possível carregar a ficha: {erroConsulta.message}</p>
      </main>
    );
  }
  if (!u) notFound();
  const { data: auth } = await sb.auth.admin.getUserById(id);
  const { count: aulas } = await sb.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", id);

  type Sub = { id: string; status: string; gateway: string; current_period_end: string | null; plans: { name: string } | null };
  const subs = ((u.subscriptions ?? []) as unknown as Sub[]).sort((a, b) => (b.current_period_end ?? "").localeCompare(a.current_period_end ?? ""));
  const perfis = (u.profiles ?? []) as unknown as { target_language: string; level: string | null }[];
  const [rotulo, cor] = SITUACAO[u.status] ?? [u.status, "border-line text-ink-soft"];

  return (
    <main className="max-w-3xl">
      <Link href="/admin/alunos" className="text-sm font-semibold text-ink-soft hover:text-ink">← Alunos</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{u.name ?? "Aluno sem nome"}</h1>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${cor}`}>{rotulo}</span>
      </div>
      <p className="text-ink-soft">{u.email}</p>

      <section className="card mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <p><span className="text-ink-soft">Cadastro:</span> {data(u.created_at)}</p>
        <p><span className="text-ink-soft">Último acesso:</span> {data(auth?.user?.last_sign_in_at)}</p>
        <p><span className="text-ink-soft">Idiomas:</span> {perfis.map((p) => `${p.target_language.toUpperCase()}${p.level ? ` (${p.level})` : ""}`).join(", ") || "—"}</p>
        <p><span className="text-ink-soft">Aulas feitas:</span> {aulas ?? 0}</p>
        <div className="sm:col-span-2">
          <p className="text-ink-soft">Assinaturas</p>
          {subs.length === 0 ? <p>Nenhuma</p> : (
            <ul className="mt-1 space-y-1">
              {subs.map((x) => (
                <li key={x.id}>{x.plans?.name ?? "—"} · {x.gateway === "cortesia" ? "cortesia" : x.gateway} · {x.status}{x.current_period_end ? ` · até ${new Date(x.current_period_end).toLocaleDateString("pt-BR")}` : ""}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {pode(s.perfil, "editar_aluno") && <EditarAlunoForm userId={u.id} nome={u.name ?? ""} email={u.email} />}
      {pode(s.perfil, "suspender") && u.status !== "excluido" && u.status !== "em_exclusao" && <BloqueioAluno userId={u.id} bloqueado={u.status === "suspenso"} />}
      {pode(s.perfil, "excluir_logico") && <ExcluirAluno userId={u.id} email={u.email} definitivo={pode(s.perfil, "excluir_definitivo")} />}
    </main>
  );
}
