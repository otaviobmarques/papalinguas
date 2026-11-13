"use client";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding, type OnboardingState } from "@/lib/client/onboarding";

const OBJETIVOS: { id: NonNullable<OnboardingState["objetivo"]>; label: string; emoji: string }[] = [
  { id: "carreira", label: "Carreira e entrevistas", emoji: "💼" },
  { id: "viagem", label: "Viagem", emoji: "✈️" },
  { id: "prova", label: "Prova de proficiência", emoji: "📝" },
  { id: "morar_fora", label: "Morar fora", emoji: "🏡" },
  { id: "conversar", label: "Conversar melhor", emoji: "💬" },
];
const INTERESSES = ["Tecnologia", "Esportes", "Música", "Negócios", "Séries", "Culinária", "Viagem", "Ciência", "Games", "Moda"];
const METAS = [5, 10, 15, 20] as const;

/** O3. Seu objetivo e interesses */
export default function Objetivo() {
  const { estado, atualizar } = useOnboarding();
  const router = useRouter();
  const pode = Boolean(estado.objetivo && estado.metaDiaria);

  const alternar = (i: string) =>
    atualizar({ interesses: estado.interesses.includes(i) ? estado.interesses.filter((x) => x !== i) : [...estado.interesses, i] });

  return (
    <OnboardingShell passo={2} voltar="/comecar/idioma">
      <h1 className="text-2xl font-extrabold">Qual é o seu objetivo principal?</h1>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {OBJETIVOS.map((o) => (
          <button key={o.id} aria-pressed={estado.objetivo === o.id} onClick={() => atualizar({ objetivo: o.id })}
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-left font-semibold aria-pressed:border-brand aria-pressed:bg-brand-soft">
            <span aria-hidden>{o.emoji}</span>{o.label}
          </button>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-extrabold">Do que você gosta de falar?</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {INTERESSES.map((i) => (
          <button key={i} className="chip" aria-pressed={estado.interesses.includes(i)} onClick={() => alternar(i)}>{i}</button>
        ))}
      </div>
      {estado.interesses.length === 0 && <p className="mt-2 text-sm text-ink-soft">Você pode escolher depois.</p>}

      <h2 className="mt-8 text-lg font-extrabold">Quanto tempo por dia?</h2>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {METAS.map((m) => (
          <button key={m} className="chip justify-center" aria-pressed={estado.metaDiaria === m} onClick={() => atualizar({ metaDiaria: m })}>{m} min</button>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <button className="btn-primary w-full" disabled={!pode} onClick={() => { atualizar({ passo: "/comecar/microfone" }); router.push("/comecar/microfone"); }}>
          Continuar
        </button>
      </div>
    </OnboardingShell>
  );
}
