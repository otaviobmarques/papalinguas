"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import TutorCharacter from "@/components/TutorCharacter";
import { useOnboarding } from "@/lib/client/onboarding";
import { tutorPorSlug } from "@/lib/demo/data";
import type { ResumoAula } from "@/components/LiveLesson";

type Aba = "gramatica" | "vocabulario" | "pronuncia" | "transcricao";

// Exemplo de relatório até a sprint 3 (fila de geração com o modelo de texto)
const EXEMPLO = {
  nota: 78,
  gramatica: [
    { disse: "I have 5 years in this company.", certo: "I've been at this company for 5 years.", porque: "Para tempo que continua até hoje, use o present perfect com \"for\"." },
    { disse: "I want to talk about my salary increase.", certo: "I'd like to talk about a raise.", porque: "\"I'd like\" é mais educado que \"I want\"; \"raise\" é a palavra natural para aumento." },
  ],
  vocabulario: [{ termo: "raise", usou: true }, { termo: "achievement", usou: true }, { termo: "deserve", usou: false }, { termo: "budget", usou: false }],
  pronuncia: [{ palavra: "achievement", nota: 54, som: "ch → /tʃ/" }, { palavra: "budget", nota: 61, som: "dg → /dʒ/" }],
};

/** A4. Relatório da aula */
export default function Relatorio() {
  const { estado } = useOnboarding();
  const tutor = tutorPorSlug(estado.tutorSlug);
  const [resumo, setResumo] = useState<(ResumoAula & { cenario: string | null }) | null>(null);
  const [gerando, setGerando] = useState(true);
  const [aba, setAba] = useState<Aba>("gramatica");
  const [revisao, setRevisao] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const r = sessionStorage.getItem("papalinguas:ultima-aula");
      if (r) setResumo(JSON.parse(r));
    } catch {}
    const t = setTimeout(() => setGerando(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (resumo && resumo.segundos < 60) {
    return (
      <main className="text-center">
        <h1 className="mt-10 text-2xl font-extrabold">Aula curtinha!</h1>
        <p className="mt-2 text-ink-soft">Aulas com menos de 1 minuto não geram relatório. Que tal tentar de novo?</p>
        <Link href="/app" className="btn-primary mt-6 w-full">Voltar ao início</Link>
      </main>
    );
  }

  if (gerando) {
    return (
      <main className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <div className="size-40"><TutorCharacter visual={tutor.visual} nome={tutor.nome} estado="pensando" className="h-full w-full" /></div>
        <p className="mt-4 font-bold" aria-live="polite">{tutor.nome} está preparando seu relatório…</p>
      </main>
    );
  }

  const min = Math.max(1, Math.round((resumo?.segundos ?? 480) / 60));
  return (
    <main>
      <header className="flex items-center gap-3">
        <div className="size-20"><TutorCharacter visual={tutor.visual} nome={tutor.nome} expressao="comemoracao" className="h-full w-full" /></div>
        <div><p className="text-sm text-ink-soft">Relatório da aula</p><h1 className="text-2xl font-extrabold">Mandou bem! 👏</h1></div>
      </header>

      <section className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[["Duração", `${min} min`], ["Missões", `${resumo?.missoesFeitas ?? 3}/3`], ["Palavras", "142"], ["Pronúncia", `${EXEMPLO.nota}`]].map(([k, v]) => (
          <div key={k} className="card p-3"><p className="text-xl font-extrabold">{v}</p><p className="text-xs text-ink-soft">{k}</p></div>
        ))}
      </section>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-2xl bg-surface-2 p-1" role="tablist">
        {(["gramatica", "vocabulario", "pronuncia", "transcricao"] as Aba[]).map((a) => (
          <button key={a} role="tab" aria-selected={aba === a} onClick={() => setAba(a)} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold capitalize ${aba === a ? "bg-surface shadow" : "text-ink-soft"}`}>
            {a === "gramatica" ? "Gramática" : a === "vocabulario" ? "Vocabulário" : a === "pronuncia" ? "Pronúncia" : "Transcrição"}
          </button>
        ))}
      </div>

      <section className="mt-3 space-y-3" role="tabpanel">
        {aba === "gramatica" && EXEMPLO.gramatica.map((g) => (
          <div key={g.disse} className="card">
            <p className="text-sm text-ink-soft">Você disse</p><p className="line-through decoration-accent/60">{g.disse}</p>
            <p className="mt-2 text-sm font-bold text-brand">Diga assim</p><p className="font-semibold">{g.certo}</p>
            <p className="mt-2 text-sm text-ink-soft">{g.porque}</p>
            <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={revisao[g.certo] ?? true} onChange={(e) => setRevisao({ ...revisao, [g.certo]: e.target.checked })} />
              Adicionar à revisão
            </label>
          </div>
        ))}
        {aba === "vocabulario" && EXEMPLO.vocabulario.map((v) => (
          <div key={v.termo} className="card flex items-center justify-between p-4"><b>{v.termo}</b><span className="text-sm text-ink-soft">{v.usou ? "✓ você usou" : "sugerida"}</span></div>
        ))}
        {aba === "pronuncia" && EXEMPLO.pronuncia.map((p) => (
          <Link key={p.palavra} href={`/app/revisao?treino=${p.palavra}`} className="card flex items-center justify-between p-4">
            <span><b>{p.palavra}</b> <span className="text-sm text-ink-soft">· som {p.som}</span></span>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${p.nota < 60 ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn"}`}>{p.nota}</span>
          </Link>
        ))}
        {aba === "transcricao" && (
          <div className="card space-y-2 text-sm">
            {(resumo?.falas.length ? resumo.falas : [{ quem: "tutor" as const, texto: "(a transcrição aparece aqui)" }]).map((f, i) => (
              <p key={i}><b>{f.quem === "tutor" ? tutor.nome : "Você"}:</b> {f.texto}</p>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link href={resumo?.cenario ? `/app/aula?cenario=${resumo.cenario}` : "/app/aula"} className="btn-ghost">Refazer cenário</Link>
        <Link href="/app" className="btn-primary">Concluir</Link>
      </div>
    </main>
  );
}
