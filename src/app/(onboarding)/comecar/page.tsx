"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TutorCharacter from "@/components/TutorCharacter";
import { TUTORES } from "@/lib/demo/data";
import { useOnboarding } from "@/lib/client/onboarding";

/** O1. Boas-vindas do app (o site institucional fica em "/") */
export default function BoasVindas() {
  const { estado, atualizar, pronto } = useOnboarding();
  const router = useRouter();
  const tutor = TUTORES[0];

  // Detecta o idioma do aparelho no primeiro acesso
  useEffect(() => {
    if (!pronto || estado.passo !== "/comecar") return;
    const nav = navigator.language.toLowerCase();
    atualizar({ uiLocale: nav.startsWith("es") ? "es" : nav.startsWith("en") ? "en" : "pt-BR" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  const retomar = pronto && estado.passo !== "/comecar" && !estado.assinante;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-4">
      <div className="flex justify-end">
        <label className="sr-only" htmlFor="ui-locale">Idioma da interface</label>
        <select
          id="ui-locale"
          value={estado.uiLocale}
          onChange={(e) => atualizar({ uiLocale: e.target.value as "pt-BR" | "en" | "es" })}
          className="min-h-11 rounded-full border border-line bg-surface px-3 text-sm font-semibold"
        >
          <option value="pt-BR">🇧🇷 Português</option>
          <option value="en">🇺🇸 English</option>
          <option value="es">🇪🇸 Español</option>
        </select>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-6 size-60 overflow-hidden rounded-full bg-brand-soft">
          <TutorCharacter slug={tutor.slug} visual={tutor.visual} nome={tutor.nome} enquadramento="rosto" expressao="sorriso" acenando className="absolute inset-0 h-full w-full" />
        </div>
        <p className="mb-2 font-bold tracking-wide text-brand">PAPALINGUAS</p>
        <h1 className="text-balance text-3xl font-extrabold leading-tight">
          Fale um novo idioma conversando com seu tutor de IA
        </h1>
        <p className="mt-3 text-ink-soft">Conversas por voz, correções gentis e revisão do que você errou.</p>
      </div>

      <div className="flex flex-col gap-3">
        {retomar ? (
          <>
            <button className="btn-primary" onClick={() => router.push(estado.passo)}>Continuar de onde parei</button>
            <Link href="/comecar/idioma" className="btn-ghost">Começar de novo</Link>
          </>
        ) : (
          <Link href="/comecar/idioma" className="btn-primary">Começar agora</Link>
        )}
        <Link href="/comecar/conta?entrar=1" className="btn-ghost">Já tenho conta</Link>
      </div>
    </main>
  );
}
