"use client";
import { useRef, useState } from "react";
import TutorCharacter from "@/components/TutorCharacter";
import { visemaDeLetra } from "@/lib/client/useLipSync";
import { TUTORES } from "@/lib/demo/data";
import { LANGUAGES, type LangCode } from "@/lib/domain/types";
import type { Visema } from "@/lib/domain/lipsync";

const TTS = { en: "en-US", es: "es-MX", pt: "pt-BR" } as const;

export default function TutoresSite() {
  const [idioma, setIdioma] = useState<LangCode | "todos">("todos");
  const [falando, setFalando] = useState<{ slug: string; visema: Visema } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const lista = TUTORES.filter((t) => idioma === "todos" || t.idioma === idioma);

  function ouvir(slug: string) {
    const t = TUTORES.find((x) => x.slug === slug)!;
    clearInterval(timer.current);
    try {
      const u = new SpeechSynthesisUtterance(t.saudacao);
      u.lang = TTS[t.idioma];
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {}
    let i = 0;
    timer.current = setInterval(() => {
      if (i > t.saudacao.length) { clearInterval(timer.current); return setFalando(null); }
      setFalando({ slug, visema: visemaDeLetra(t.saudacao[i++] ?? " ") });
    }, 70);
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por idioma">
        <button className="chip" aria-pressed={idioma === "todos"} onClick={() => setIdioma("todos")}>Todos</button>
        {(Object.keys(LANGUAGES) as LangCode[]).map((l) => (
          <button key={l} className="chip" aria-pressed={idioma === l} onClick={() => setIdioma(l)}>{LANGUAGES[l].bandeira} {LANGUAGES[l].nome.split(" ")[0]}</button>
        ))}
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {lista.map((t) => (
          <li key={t.slug} className="card flex flex-col items-center p-4 text-center transition hover:-translate-y-1 hover:shadow-lg">
            <div className="h-36 w-32 overflow-hidden rounded-2xl bg-surface-2">
              <TutorCharacter visual={t.visual} nome={t.nome} estado={falando?.slug === t.slug ? "falando" : "repouso"} visema={falando?.slug === t.slug ? falando.visema : 0} className="h-full w-full" />
            </div>
            <p className="mt-3 text-lg font-extrabold">{t.nome}</p>
            <p className="text-xs text-ink-soft">{LANGUAGES[t.idioma].bandeira} sotaque {t.sotaque}</p>
            <p className="mt-1 text-sm">{t.estilo}</p>
            <button className="mt-2 min-h-11 text-sm font-bold text-brand" onClick={() => ouvir(t.slug)}>▶ Ouvir {t.nome}</button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-xs text-ink-soft">Os tutores são inteligências artificiais com personagens ilustrados. No app, a voz é gerada em tempo real; aqui no site, a amostra usa a voz do seu navegador.</p>
    </div>
  );
}
