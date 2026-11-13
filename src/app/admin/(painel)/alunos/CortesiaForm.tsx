"use client";
import { useActionState, useState } from "react";
import { concederCortesia, encerrarCortesia, type EstadoCortesia } from "./actions";

function Aviso({ e }: { e: EstadoCortesia }) {
  if (!e) return null;
  return e.erro
    ? <p role="alert" className="text-sm font-semibold text-danger">{e.erro}</p>
    : <p role="status" className="text-sm font-semibold text-ok">{e.ok}</p>;
}

const campo = "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm";

export function CortesiaForm() {
  const [estado, acao, enviando] = useActionState(concederCortesia, null);
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
      <div className="flex flex-col gap-2 sm:col-span-2">
        <button className="btn-primary self-start" disabled={enviando}>{enviando ? "Cadastrando…" : "Cadastrar cortesia"}</button>
        <p className="text-xs text-ink-soft">A cortesia não renova e não gera cobrança nem nota fiscal. O aluno entra pelo app com este e-mail (código enviado por e-mail) e faz o cadastro inicial; a tela de planos é pulada.</p>
        <Aviso e={estado} />
      </div>
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
