"use client";
import Icone from "@/components/Icone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOnboarding } from "@/lib/client/onboarding";
import { recarregarAluno, resumoTela, useAluno } from "@/lib/client/aluno";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LANGUAGES, type LangCode } from "@/lib/domain/types";
import { tutorPorSlug } from "@/lib/demo/data";

/** A8. Perfil e configurações */
export default function Perfil() {
  const { estado, limpar } = useOnboarding();
  const router = useRouter();
  const [excluir, setExcluir] = useState<0 | 1 | 2>(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const { aluno } = useAluno();
  const r = resumoTela(aluno, estado);
  const [meta, setMeta] = useState<number | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [trocando, setTrocando] = useState(false);

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 8) return setAviso("A senha precisa ter pelo menos 8 caracteres.");
    setTrocando(true);
    const { error } = (await supabaseBrowser()?.auth.updateUser({ password: novaSenha })) ?? { error: new Error("sem conexão") };
    setTrocando(false);
    setNovaSenha("");
    setAviso(error ? "Não foi possível trocar a senha agora. Tente de novo." : "Senha alterada. Use a nova senha no próximo acesso.");
  }
  const tutor = tutorPorSlug(r.tutorSlug);
  const metaAtual = meta ?? r.metaDiaria;

  async function salvarMeta(m: number) {
    setMeta(m);
    const sb = supabaseBrowser();
    const { data } = (await sb?.auth.getUser()) ?? { data: { user: null } };
    if (sb && data.user) {
      await sb.from("profiles").update({ daily_goal_minutes: m }).eq("user_id", data.user.id).eq("target_language", r.idioma);
      recarregarAluno();
    }
  }

  async function sair() {
    await supabaseBrowser()?.auth.signOut();
    recarregarAluno();
    limpar();
    router.push("/");
  }

  async function confirmarExclusao() {
    if (!aluno) {
      limpar();
      router.push("/");
      return;
    }
    const resp = await fetch("/api/conta/excluir", { method: "POST" }).catch(() => null);
    if (!resp?.ok) {
      setAviso("Não conseguimos registrar o pedido agora. Tente de novo ou fale com o suporte.");
      setExcluir(0);
      return;
    }
    const { excluidaEm } = await resp.json();
    setExcluir(0);
    setAviso(`Pedido de exclusão registrado. Sua conta e seus dados pessoais serão apagados em ${new Date(excluidaEm).toLocaleDateString("pt-BR")}. Até lá, você pode desistir falando com o suporte.`);
    await supabaseBrowser()?.auth.signOut();
    limpar();
  }
  const Item = ({ href, children }: { href?: string; children: React.ReactNode }) =>
    href ? <Link href={href} className="flex min-h-14 items-center justify-between gap-2 px-4 transition hover:bg-white/[0.03]">{children}<Icone nome="chevron" className="size-4 text-ink-soft" /></Link>
         : <div className="flex min-h-14 items-center justify-between px-4">{children}</div>;

  return (
    <main>
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-[#2f80ed] text-2xl font-extrabold text-[#04170b]" aria-hidden>{(aluno?.nome ?? estado.email)?.trim()[0]?.toUpperCase() ?? <Icone nome="perfil" className="size-7" />}</span>
        <div className="min-w-0"><h1 className="text-2xl font-extrabold tracking-tight">Perfil</h1>
        <p className="truncate text-ink-soft">{aluno ? `${aluno.nome} · ${aluno.email}` : (estado.email ?? "conta de demonstração")}</p></div>
      </div>
      {aviso && <p role="status" className="mt-3 rounded-2xl bg-brand-soft p-3 text-sm font-semibold">{aviso}</p>}
      <ul className="card mt-4 divide-y divide-line p-0">
        <li><Item>Idioma estudado <b>{LANGUAGES[(r.idioma as LangCode) ?? "en"].nome}</b></Item></li>
        <li><Item>Nível <b>{r.nivel}</b></Item></li>
        <li><Item href="/comecar/tutor?voltar=/app/perfil">Tutor <b>{tutor.nome}</b></Item></li>
        <li className="flex min-h-14 items-center justify-between gap-2 px-4">
          <label htmlFor="meta">Meta diária</label>
          <select id="meta" value={metaAtual} onChange={(e) => salvarMeta(Number(e.target.value))} className="min-h-11 rounded-xl border border-line bg-surface px-2 font-bold">
            {[5, 10, 15, 20].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </li>
        <li><Item href="/app/assinatura">Minha assinatura</Item></li>
      </ul>
      {aluno && (
        <>
          <h2 className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Senha</h2>
          <form onSubmit={trocarSenha} className="card mt-2 flex gap-2 p-3">
            <label htmlFor="nova-senha" className="sr-only">Nova senha</label>
            <input id="nova-senha" type="password" autoComplete="new-password" minLength={8} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha (mín. 8 caracteres)" className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-white/[0.03] px-3" />
            <button className="btn-ghost min-h-11 shrink-0 px-4 py-2 text-sm" disabled={trocando || novaSenha.length < 8}>{trocando ? "Salvando…" : "Trocar"}</button>
          </form>
        </>
      )}
      <h2 className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Privacidade</h2>
      <ul className="card mt-2 divide-y divide-line p-0">
        <li><Item>Baixar meus dados <span className="text-xs text-ink-soft">em breve</span></Item></li>
        <li><Item>Apagar áudios <span className="text-xs text-ink-soft">automático em 30 dias</span></Item></li>
        <li><button className="flex min-h-14 w-full items-center px-4 font-semibold text-danger" onClick={() => setExcluir(1)}>Excluir conta</button></li>
      </ul>
      {excluir > 0 && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 grid place-items-end bg-black/60 p-4 backdrop-blur-sm sm:place-items-center">
          <div className="card w-full max-w-md">
            {excluir === 1 ? (
              <>
                <h2 className="text-xl font-extrabold">Excluir sua conta?</h2>
                <p className="mt-2 text-sm">Registramos seu pedido e sua conta fica bloqueada. Você tem 30 dias para desistir; depois disso, seus dados pessoais e áudios são apagados e não há novas cobranças.</p>
                <div className="mt-4 grid grid-cols-2 gap-2"><button className="btn-ghost" onClick={() => setExcluir(0)}>Voltar</button><button className="btn-accent" onClick={() => setExcluir(2)}>Continuar</button></div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold">Confirmação final</h2>
                <p className="mt-2 text-sm">Tem certeza? Você sai do app e não consegue mais fazer aulas com esta conta.</p>
                <div className="mt-4 grid grid-cols-2 gap-2"><button className="btn-ghost" onClick={() => setExcluir(0)}>Cancelar</button><button className="btn bg-danger text-[#2a0606]" onClick={confirmarExclusao}>Excluir conta</button></div>
              </>
            )}
          </div>
        </div>
      )}
      {aluno && <button className="btn-ghost mt-6 w-full" onClick={sair}><Icone nome="sair" className="size-5" /> Sair</button>}
      <Link href="/admin" className="mt-8 block text-center text-xs text-ink-soft underline">Painel do administrador</Link>
    </main>
  );
}
