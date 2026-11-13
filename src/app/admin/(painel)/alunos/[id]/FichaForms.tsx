"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { gerarSenha } from "@/lib/domain/acesso";
import { bloquearAluno, desbloquearAluno, editarAluno, excluirAluno } from "../actions";
import { Aviso } from "../CortesiaForm";

const campo = "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm";

export function EditarAlunoForm({ userId, nome, email }: { userId: string; nome: string; email: string }) {
  const [estado, acao, enviando] = useActionState(editarAluno, null);
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  useEffect(() => { if (estado?.ok) setSenha(""); }, [estado]);
  return (
    <form action={acao} className="card mt-5 grid gap-3 sm:grid-cols-2" autoComplete="off">
      <h2 className="text-lg font-extrabold sm:col-span-2">Editar aluno</h2>
      <input type="hidden" name="userId" value={userId} />
      <label className="text-sm font-semibold">Nome<input name="nome" required defaultValue={nome} className={`${campo} mt-1`} /></label>
      <label className="text-sm font-semibold">E-mail (login)<input name="email" type="email" required defaultValue={email} className={`${campo} mt-1`} /></label>
      <div className="text-sm font-semibold sm:col-span-2">
        <label htmlFor="nova-senha">Nova senha (opcional)</label>
        <div className="mt-1 flex gap-2">
          <input id="nova-senha" name="senha" type={ver ? "text" : "password"} minLength={8} maxLength={72} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)}
            placeholder="Deixe em branco para manter a senha atual" className={`${campo} font-mono`} />
          <button type="button" className="btn-ghost min-h-11 shrink-0 px-3 py-2 text-sm" onClick={() => { setSenha(gerarSenha()); setVer(true); }}>Gerar</button>
          <button type="button" className="btn-ghost min-h-11 shrink-0 px-3 py-2 text-sm" onClick={() => setVer(!ver)} aria-pressed={ver}>{ver ? "Ocultar" : "Mostrar"}</button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <button className="btn-primary self-start" disabled={enviando}>{enviando ? "Salvando…" : "Salvar alterações"}</button>
        <p className="text-xs text-ink-soft">Trocar o e-mail muda o login do aluno na hora, sem confirmação. Trocar a senha faz a anterior parar de funcionar.</p>
        <Aviso e={estado} />
      </div>
    </form>
  );
}

export function BloqueioAluno({ userId, bloqueado }: { userId: string; bloqueado: boolean }) {
  const [eB, bloquear, bloqueando] = useActionState(bloquearAluno, null);
  const [eD, desbloquear, desbloqueando] = useActionState(desbloquearAluno, null);
  return (
    <section className="card mt-5">
      <h2 className="text-lg font-extrabold">{bloqueado ? "Aluno bloqueado" : "Bloquear aluno"}</h2>
      <p className="mt-1 text-sm text-ink-soft">{bloqueado ? "Ele não consegue entrar no app nem iniciar aulas. A assinatura e os dados continuam guardados." : "O aluno deixa de conseguir entrar e iniciar aulas. Dá para desbloquear depois; nada é apagado."}</p>
      {bloqueado ? (
        <form action={desbloquear} className="mt-3 grid gap-2">
          <input type="hidden" name="userId" value={userId} />
          <button className="btn-primary self-start" disabled={desbloqueando}>{desbloqueando ? "Desbloqueando…" : "Desbloquear aluno"}</button>
          <Aviso e={eD} />
        </form>
      ) : (
        <form action={bloquear} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="userId" value={userId} />
          <input name="motivo" required minLength={3} placeholder="Motivo (vai para a auditoria)" className={campo} />
          <button className="btn min-h-11 border border-danger/40 bg-danger/10 py-2 text-danger hover:bg-danger/20" disabled={bloqueando}>{bloqueando ? "Bloqueando…" : "Bloquear"}</button>
          <div className="sm:col-span-2"><Aviso e={eB} /></div>
        </form>
      )}
    </section>
  );
}

export function ExcluirAluno({ userId, email, definitivo }: { userId: string; email: string; definitivo: boolean }) {
  const [estado, acao, excluindo] = useActionState(excluirAluno, null);
  const [aberto, setAberto] = useState(false);
  const [conf, setConf] = useState("");
  const router = useRouter();
  useEffect(() => { if (estado?.excluido) { const t = setTimeout(() => router.push("/admin/alunos"), 1500); return () => clearTimeout(t); } }, [estado, router]);
  return (
    <section className="card mt-5 border-danger/30">
      <h2 className="text-lg font-extrabold text-danger">Excluir aluno</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {definitivo
          ? "Apaga o login, o perfil, as aulas, os relatórios e o progresso. Não tem volta. Pagamentos e notas fiscais ficam guardados, sem vínculo com o aluno (obrigação fiscal)."
          : "Bloqueia o aluno e marca a conta para exclusão. A exclusão definitiva é feita pelo Super Admin."}
      </p>
      {!aberto ? (
        <button type="button" className="btn mt-3 min-h-11 border border-danger/40 bg-danger/10 py-2 text-danger hover:bg-danger/20" onClick={() => setAberto(true)}>Excluir aluno…</button>
      ) : (
        <form action={acao} className="mt-3 grid gap-2">
          <input type="hidden" name="userId" value={userId} />
          <label className="text-sm font-semibold">Para confirmar, digite o e-mail do aluno: <span className="font-mono">{email}</span>
            <input name="confirmacao" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="off" className={`${campo} mt-1`} />
          </label>
          <input name="motivo" required minLength={3} placeholder="Motivo (vai para a auditoria)" className={campo} />
          <div className="flex gap-2">
            <button type="button" className="btn-ghost min-h-11 py-2" onClick={() => { setAberto(false); setConf(""); }}>Cancelar</button>
            <button className="btn min-h-11 bg-danger py-2 text-[#2a0606] hover:brightness-110" disabled={excluindo || conf.trim().toLowerCase() !== email.toLowerCase()}>
              {excluindo ? "Excluindo…" : definitivo ? "Excluir definitivamente" : "Marcar para exclusão"}
            </button>
          </div>
          <Aviso e={estado} />
        </form>
      )}
    </section>
  );
}
