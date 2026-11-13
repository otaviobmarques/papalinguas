"use client";
import Icone from "@/components/Icone";
import Link from "next/link";
import { useState } from "react";
import { novaMeiaVida, proximaRevisao, type Resposta } from "@/lib/domain/srs";

interface Cartao { id: string; frente: string; verso: string; meiaVidaH: number }
const INICIAIS: Cartao[] = [
  { id: "1", frente: "Eu trabalho nesta empresa há 5 anos.", verso: "I've been at this company for 5 years.", meiaVidaH: 24 },
  { id: "2", frente: "Eu gostaria de falar sobre um aumento.", verso: "I'd like to talk about a raise.", meiaVidaH: 24 },
  { id: "3", frente: "prazo", verso: "deadline", meiaVidaH: 48 },
];

/** A6. Revisão (cartões). Não consome a cota de minutos. TODO(sprint 3): resposta falada + cache offline. */
export default function Revisao() {
  const [fila, setFila] = useState(INICIAIS);
  const [virado, setVirado] = useState(false);
  const [feitos, setFeitos] = useState<{ id: string; proxima: Date }[]>([]);
  const atual = fila[0];

  function responder(r: Resposta) {
    const h = novaMeiaVida(atual.meiaVidaH, r);
    setFeitos((f) => [...f, { id: atual.id, proxima: proximaRevisao(new Date(), h) }]);
    setFila((q) => (r === "errei" ? [...q.slice(1), { ...atual, meiaVidaH: h }] : q.slice(1)));
    setVirado(false);
  }

  if (!atual) {
    return (
      <main className="mt-10 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-brand/15 text-[#5ee29b] shadow-[0_0_40px_rgba(24,169,87,.35)]"><Icone nome="check" className="size-10" /></span>
        <h1 className="mt-3 text-2xl font-extrabold">Revisão de hoje concluída!</h1>
        <p className="mt-2 text-ink-soft">Próximos cartões: {feitos.length ? feitos.map((f) => f.proxima).sort((a, b) => +a - +b)[0].toLocaleDateString("pt-BR") : "amanhã"}.</p>
        <Link href="/app/aula" className="btn-primary mt-6 w-full">Fazer uma aula</Link>
      </main>
    );
  }

  return (
    <main>
      <div className="flex items-baseline justify-between"><h1 className="text-2xl font-extrabold tracking-tight">Revisão</h1><span className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft">{fila.length} cartões</span></div>
      <button onClick={() => setVirado(!virado)} className={`card mt-4 flex min-h-72 w-full flex-col items-center justify-center text-center transition duration-300 ${virado ? "border-brand/50 bg-[radial-gradient(ellipse_at_top,rgba(24,169,87,.22),transparent_65%)]" : "bg-[radial-gradient(ellipse_at_top,rgba(47,128,237,.18),transparent_65%)]"}`} aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">{virado ? "Resposta" : "Como se diz?"}</p>
        <p className="mt-3 text-2xl font-extrabold leading-snug">{virado ? atual.verso : atual.frente}</p>
        {!virado && <p className="mt-4 text-sm text-ink-soft">Diga em voz alta e toque para ver</p>}
      </button>
      {virado ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="btn-ghost text-danger hover:border-danger/40" onClick={() => responder("errei")}>Errei</button>
          <button className="btn-ghost" onClick={() => responder("dificil")}>Difícil</button>
          <button className="btn-primary" onClick={() => responder("facil")}>Fácil</button>
        </div>
      ) : (
        <button className="mt-4 w-full min-h-11 text-sm font-semibold text-ink-soft underline" onClick={() => setFila((q) => [...q.slice(1), q[0]])}>Pular</button>
      )}
    </main>
  );
}
