import { redirect } from "next/navigation";
import { entrar, sessaoAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar · Papalinguas Admin", robots: { index: false } };

async function acaoEntrar(form: FormData) {
  "use server";
  const r = await entrar(String(form.get("usuario") ?? ""), String(form.get("senha") ?? ""));
  if (!r.ok) redirect(`/admin/login?erro=${encodeURIComponent(r.erro)}`);
  redirect("/admin");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (await sessaoAdmin()) redirect("/admin");
  const { erro } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <p className="font-extrabold text-brand">Papalinguas · Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold">Entrar no painel</h1>
      <form action={acaoEntrar} className="card mt-6 flex flex-col gap-3">
        <label htmlFor="usuario" className="font-semibold">Usuário</label>
        <input id="usuario" name="usuario" required autoComplete="username" className="min-h-12 rounded-2xl border border-line bg-surface px-4" />
        <label htmlFor="senha" className="font-semibold">Senha</label>
        <input id="senha" name="senha" type="password" required autoComplete="current-password" className="min-h-12 rounded-2xl border border-line bg-surface px-4" />
        {erro && <p role="alert" className="text-sm font-semibold text-danger">{erro}</p>}
        <button className="btn-primary mt-2">Entrar</button>
      </form>
      <p className="mt-4 text-center text-xs text-ink-soft">Acesso restrito à equipe. Sessão expira em 8 horas.</p>
    </main>
  );
}
