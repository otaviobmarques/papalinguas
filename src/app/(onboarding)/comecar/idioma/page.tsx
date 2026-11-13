"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding } from "@/lib/client/onboarding";
import { LANGUAGES, type LangCode } from "@/lib/domain/types";

/** O2. O que você quer aprender */
export default function Idioma() {
  const { estado, atualizar } = useOnboarding();
  const router = useRouter();
  const [perguntaPt, setPerguntaPt] = useState(false);

  const escolher = (idioma: LangCode) => {
    if (idioma === "pt") {
      atualizar({ idioma });
      setPerguntaPt(true);
      return;
    }
    atualizar({ idioma, passo: "/comecar/objetivo" });
    router.push("/comecar/objetivo");
  };

  return (
    <OnboardingShell passo={1} voltar="/comecar">
      <h1 className="text-2xl font-extrabold">O que você quer aprender?</h1>
      <p className="mt-1 text-ink-soft">Você pode adicionar outro idioma depois, no Perfil.</p>
      <div className="mt-6 flex flex-col gap-3">
        {(Object.keys(LANGUAGES) as LangCode[]).map((c) => (
          <button
            key={c}
            onClick={() => escolher(c)}
            aria-pressed={estado.idioma === c}
            className="card flex items-center gap-4 text-left transition hover:border-brand aria-pressed:border-brand aria-pressed:bg-brand-soft"
          >
            <span className="text-4xl" aria-hidden>{LANGUAGES[c].bandeira}</span>
            <span className="text-lg font-bold">{LANGUAGES[c].nome}</span>
          </button>
        ))}
      </div>

      {perguntaPt && (
        <div role="dialog" aria-modal="true" aria-labelledby="qual-lingua" className="fixed inset-0 z-10 grid place-items-end bg-black/40 p-4 sm:place-items-center">
          <div className="card w-full max-w-md">
            <h2 id="qual-lingua" className="text-xl font-extrabold">What is your language? / ¿Cuál es tu idioma?</h2>
            <div className="mt-4 flex flex-col gap-3">
              {([["en", "English"], ["es", "Español"]] as const).map(([loc, label]) => (
                <button key={loc} className="btn-ghost" onClick={() => { atualizar({ uiLocale: loc, passo: "/comecar/objetivo" }); router.push("/comecar/objetivo"); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
