"use client";
import { useActionState, useState } from "react";
import { gerarSenha } from "@/lib/domain/acesso";
import { concederCortesia, encerrarCortesia, novoAcesso, type Convite, type EstadoCortesia } from "./actions";

export function Aviso({ e }: { e: EstadoCortesia }) {
  if (!e) return null;
  return e.erro
    ? <p role="alert" className="text-sm font-semibold text-danger">{e.erro}</p>
    : <div className="grid gap-3"><p role="status" className="text-sm font-semibold text-ok">{e.ok}</p>{e.convite && <QuadroConvite c={e.convite} />}</div>;
}

function Copiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn-ghost min-h-10 px-3 py-1.5 text-sm"
      onClick={async () => { try { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 2000); } catch {} }}>
      {ok ? "Copiado!" : rotulo}
    </button>
  );
}

/** Link de acesso e mensagem pronta para enviar ao aluno (a senha aparece só agora; não fica salva no painel). */
function QuadroConvite({ c }: { c: Convite }) {
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(c.mensagem)}`;
  return (
    <div className="rounded-2xl border border-brand/40 bg-brand/10 p-4 text-sm">
      <p className="font-bold">Acesso do aluno</p>
      <dl className="mt-2 grid gap-1">
        <div className="flex flex-wrap gap-x-2"><dt className="text-ink-soft">Link:</dt><dd className="break-all font-mono text-xs">{c.link}</dd></div>
        <div className="flex gap-2"><dt className="text-ink-soft">E-mail:</dt><dd className="font-semibold">{c.email}</dd></div>
        {c.senha && <div className="flex gap-2"><dt className="text-ink-soft">Senha:</dt><dd className="font-mono font-bold">{c.senha}</dd></div>}
      </dl>
      <textarea readOnly value={c.mensagem} rows={7} aria-label="Mensagem para o aluno" className="mt-3 w-full rounded-xl border border-line bg-surface p-3 text-xs" />
      <div className="mt-2 flex flex-wrap gap-2">
        <Copiar texto={c.mensagem} rotulo="Copiar mensagem" />
        <Copiar texto={c.link} rotulo="Copiar link" />
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-10 px-3 py-1.5 text-sm">Enviar pelo WhatsApp</a>
      </div>
      {c.senha && <p className="mt-2 text-xs text-ink-soft">Guarde ou envie agora: a senha não aparece de novo. Se o aluno perder, use “Novo acesso” na lista.</p>}
    </div>
  );
}

const campo = "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm";

export function CortesiaForm() {
  const [estado, acao, enviando] = useActionState(concederCortesia, null);
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  return (
    <form action={acao} className="card grid gap-3 sm:grid-cols-2" autoComplete="off">
      <h2 className="text-lg font-extrabold sm:col-span-2">Cadastrar aluno cortesia (sem cobrança)</h2>
      <label className="text-sm font-semibold">Nome<input name="nome" required className={`${campo} mt-1`} /></label>
      <label className="text-sm font-semibold">E-mail<input name="email" type="email" required className={`${campo} mt-1`} /></label>
      <label className="text-sm font-semibold">Idioma
        <select name="idioma" className={`${campo} mt-1`} defaultValue="en">
          <option value="en">Inglês</option><option value="es">Espanhol</option><option value="pt">Português (estrangeiros)</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Plano
        <select name="plano" className={`${campo} mt-1`} defaultValue="essencial">
          <option value="essencial">Essencial (150 min/mês)</option><option value="fluente">Fluente (300 min/mês)</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Duração
        <select name="dias" className={`${campo} mt-1`} defaultValue="30">
          <option value="30">30 dias</option><option value="90">90 dias</option><option value="180">6 meses</option><option value="365">1 ano</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Motivo (auditoria)<input name="motivo" required placeholder="Ex.: teste interno, parceiro, professor revisor" className={`${campo} mt-1`} /></label>
      <div className="text-sm font-semibold sm:col-span-2">
        <label htmlFor="senha">Senha de acesso (opcional, mínimo 8 caracteres)</label>
        <div className="mt-1 flex gap-2">
          <input id="senha" name="senha" type={ver ? "text" : "password"} minLength={8} maxLength={72} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)}
            placeholder="Deixe em branco para o aluno entrar com código por e-mail" className={`${campo} font-mono`} />
          <button type="button" className="btn-ghost min-h-11 shrink-0 px-3 py-2 text-sm" onClick={() => { setSenha(gerarSenha()); setVer(true); }}>Gerar</button>
          <button type="button" className="btn-ghost min-h-11 shrink-0 px-3 py-2 text-sm" onClick={() => setVer(!ver)} aria-pressed={ver}>{ver ? "Ocultar" : "Mostrar"}</button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <button className="btn-primary self-start" disabled={enviando}>{enviando ? "Cadastrando…" : "Cadastrar cortesia"}</button>
        <p className="text-xs text-ink-soft">A cortesia não renova e não gera cobrança nem nota fiscal. Depois de cadastrar, você recebe o link e a mensagem pronta para enviar. O aluno entra com e-mail e senha (ou código por e-mail), faz o cadastro inicial e a tela de planos é pulada.</p>
        <Aviso e={estado} />
      </div>
    </form>
  );
}

export function NovoAcesso({ userId }: { userId: string }) {
  const [estado, acao, enviando] = useActionState(novoAcesso, null);
  return (
    <form action={acao} className="grid gap-2">
      <input type="hidden" name="userId" value={userId} />
      <button className="text-xs font-semibold text-brand underline" disabled={enviando}>{enviando ? "Gerando…" : "Novo acesso"}</button>
      <Aviso e={estado} />
    </form>
  );
}

export function EncerrarCortesia({ assinaturaId }: { assinaturaId: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState(encerrarCortesia, null);
  if (!aberto) return <button className="text-xs font-semibold text-danger underline" onClick={() => setAberto(true)}>Encerrar</button>;
  return (
    <form action={acao} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="assinaturaId" value={assinaturaId} />
      <input name="motivo" required placeholder="Motivo" className="min-h-9 rounded-lg border border-line bg-surface px-2 text-xs" />
      <button className="rounded-lg bg-danger px-2 py-1 text-xs font-bold text-white" disabled={enviando}>Confirmar</button>
      <button type="button" className="text-xs underline" onClick={() => setAberto(false)}>Cancelar</button>
      <Aviso e={estado} />
    </form>
  );
}
