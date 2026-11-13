"use client";
import { Fragment, useActionState, useState } from "react";
import { removerChave, salvarChave, testarChave, type EstadoForm } from "./actions";

interface Props {
  provider: "openai" | "anthropic" | "asaas" | "azure_speech";
  extras?: { rotulo: string; valor: string }[];
  /** Pede um campo extra de região (Azure). */
  pedeRegiao?: boolean;
  titulo: string;
  descricao: string;
  placeholder: string;
  atual: { mascara: string; status: string; validadaEm: string | null; atualizadaEm: string } | null;
}

function Aviso({ e }: { e: EstadoForm }) {
  if (!e) return null;
  return e.erro
    ? <p role="alert" className="mt-2 text-sm font-semibold text-danger">{e.erro}</p>
    : <p role="status" className="mt-2 text-sm font-semibold text-ok">{e.ok}</p>;
}

export default function ChaveCard({ provider, titulo, descricao, placeholder, atual, extras, pedeRegiao }: Props) {
  const [salvo, acaoSalvar, salvando] = useActionState(salvarChave, null);
  const [teste, acaoTestar, testando] = useActionState(testarChave, null);
  const [remocao, acaoRemover, removendo] = useActionState(removerChave, null);
  const [editando, setEditando] = useState(!atual);
  const [removendoAberto, setRemovendoAberto] = useState(false);
  const status = atual?.status === "valida" ? ["bg-brand-soft text-ok", "● válida"] : atual?.status === "invalida" ? ["bg-accent-soft text-danger", "● inválida"] : ["bg-surface-2 text-ink-soft", "● não validada"];

  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold">{titulo}</h2>
          <p className="text-sm text-ink-soft">{descricao}</p>
        </div>
        {atual && <span className={`rounded-full px-3 py-1 text-xs font-bold ${status[0]}`}>{status[1]}</span>}
      </div>

      {atual ? (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-soft">Chave</dt><dd className="font-mono">{atual.mascara}</dd>
          <dt className="text-ink-soft">Validada em</dt><dd>{atual.validadaEm ? new Date(atual.validadaEm).toLocaleString("pt-BR") : "—"}</dd>
          <dt className="text-ink-soft">Atualizada em</dt><dd>{new Date(atual.atualizadaEm).toLocaleString("pt-BR")}</dd>
          {extras?.map((x) => (<Fragment key={x.rotulo}><dt className="text-ink-soft">{x.rotulo}</dt><dd>{x.valor}</dd></Fragment>))}
        </dl>
      ) : (
        <p className="mt-4 rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn">Nenhuma chave cadastrada.</p>
      )}

      {atual && !editando && (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={acaoTestar}><input type="hidden" name="provider" value={provider} /><button className="btn-ghost" disabled={testando}>{testando ? "Testando…" : "Testar chave"}</button></form>
          <button className="btn-ghost" onClick={() => setEditando(true)}>Substituir</button>
          <button className="btn-ghost text-danger" onClick={() => setRemovendoAberto(true)}>Remover</button>
        </div>
      )}
      <Aviso e={teste} />

      {editando && (
        <form action={acaoSalvar} className="mt-4 flex flex-col gap-2" autoComplete="off">
          <input type="hidden" name="provider" value={provider} />
          <label htmlFor={`chave-${provider}`} className="text-sm font-semibold">{atual ? "Nova chave" : "Chave"}</label>
          <input id={`chave-${provider}`} name="chave" type="password" required placeholder={placeholder} autoComplete="new-password" spellCheck={false}
            className="min-h-12 rounded-2xl border border-line bg-surface px-4 font-mono text-sm" />
          {pedeRegiao && (
            <>
              <label htmlFor={`regiao-${provider}`} className="text-sm font-semibold">Região do recurso <span className="font-normal text-ink-soft">(opcional)</span></label>
              <input id={`regiao-${provider}`} name="regiao" placeholder="Deixe em branco para detectar automaticamente" className="min-h-12 rounded-2xl border border-line bg-surface px-4 text-sm" />
              <p className="text-xs text-ink-soft">Se souber, está em portal.azure.com → seu recurso → Visão geral → Local (ex.: East US). Em branco, testamos a chave nas regiões da Azure e usamos a que funcionar.</p>
            </>
          )}
          <label htmlFor={`motivo-${provider}`} className="text-sm font-semibold">Motivo (vai para a auditoria)</label>
          <input id={`motivo-${provider}`} name="motivo" required defaultValue={atual ? "" : "Cadastro inicial"} className="min-h-12 rounded-2xl border border-line bg-surface px-4 text-sm" />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={salvando}>{salvando ? "Validando…" : "Validar e salvar"}</button>
            {atual && <button type="button" className="btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>}
          </div>
          <p className="text-xs text-ink-soft">A chave é testada com o fornecedor antes de salvar, guardada cifrada (AES-256-GCM) e nunca é exibida de novo.</p>
          <Aviso e={salvo} />
        </form>
      )}

      {removendoAberto && (
        <form action={acaoRemover} className="mt-4 flex flex-col gap-2 rounded-2xl border border-danger p-3">
          <input type="hidden" name="provider" value={provider} />
          <p className="text-sm font-semibold">Remover esta chave? {provider === "openai" ? "As aulas por voz param de funcionar até cadastrar outra." : provider === "asaas" ? "Novas assinaturas param de funcionar até cadastrar outra." : provider === "azure_speech" ? "A avaliação de pronúncia para de funcionar até cadastrar outra." : "O texto fica sem backup."}</p>
          <input name="motivo" required placeholder="Motivo" className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm" />
          <input name="confirmacao" required placeholder="Digite REMOVER" className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm" />
          <div className="flex gap-2">
            <button className="btn bg-danger text-white" disabled={removendo}>Remover</button>
            <button type="button" className="btn-ghost" onClick={() => setRemovendoAberto(false)}>Cancelar</button>
          </div>
          <Aviso e={remocao} />
        </form>
      )}
    </section>
  );
}
