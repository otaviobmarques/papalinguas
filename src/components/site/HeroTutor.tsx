"use client";
import { useEffect, useState } from "react";
import TutorCharacter from "@/components/TutorCharacter";
import { visemaDeLetra } from "@/lib/client/useLipSync";
import { TUTORES } from "@/lib/demo/data";
import type { Visema } from "@/lib/domain/lipsync";

const FALAS = [
  { slug: "maya", texto: "Hi! Ready to chat?" },
  { slug: "lucia", texto: "¡Hola! ¿Platicamos?" },
  { slug: "bia", texto: "Oi! Vamos conversar?" },
  { slug: "oliver", texto: "Shall we begin?" },
];

/** Tutores se revezando no topo do site, falando nos três idiomas (boca animada pelo texto). */
export default function HeroTutor() {
  const [i, setI] = useState(0);
  const [letra, setLetra] = useState(0);
  const fala = FALAS[i];
  const tutor = TUTORES.find((t) => t.slug === fala.slug)!;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setLetra((l) => {
        if (l > fala.texto.length + 22) {
          setI((x) => (x + 1) % FALAS.length);
          return 0;
        }
        return l + 1;
      });
    }, 75);
    return () => clearInterval(t);
  }, [fala.texto.length]);

  const falando = letra <= fala.texto.length;
  const visema: Visema = falando ? visemaDeLetra(fala.texto[letra] ?? " ") : 0;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <div className="absolute inset-6 rounded-full bg-brand-soft" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 top-8">
        <TutorCharacter visual={tutor.visual} nome={tutor.nome} estado={falando ? "falando" : "repouso"} visema={visema} expressao={falando ? "neutra" : "sorriso"} className="h-full w-full" />
      </div>
      <div className="absolute -right-2 top-4 max-w-[60%] rounded-2xl rounded-bl-sm bg-surface px-4 py-3 text-base font-bold shadow-lg sm:-right-6" aria-live="polite">
        {fala.texto.slice(0, Math.max(1, letra))}
        <span className="mt-1 block text-xs font-semibold text-ink-soft">{tutor.nome} · {tutor.genero === "masculino" ? "tutor" : "tutora"} de IA</span>
      </div>
    </div>
  );
}
