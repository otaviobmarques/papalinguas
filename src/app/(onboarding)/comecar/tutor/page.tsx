"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OnboardingShell from "@/components/OnboardingShell";
import TutorCharacter from "@/components/TutorCharacter";
import { useOnboarding } from "@/lib/client/onboarding";
import { supabaseBrowser } from "@/lib/supabase/client";
import { visemaDeLetra } from "@/lib/client/useLipSync";
import { TUTORES, type TutorDemo } from "@/lib/demo/data";
import { CEFR_DESCRICAO, LANGUAGES, type LangCode } from "@/lib/domain/types";
import type { Visema } from "@/lib/domain/lipsync";

const TTS = { en: "en-US", es: "es-MX", pt: "pt-BR" } as const;

/** O7. Resultado e escolha do tutor */
export default function EscolhaTutor() {
  const { estado, atualizar, pronto } = useOnboarding();
  const router = useRouter();
  const [idioma, setIdioma] = useState<LangCode>("en");
  const [genero, setGenero] = useState<"todos" | "feminino" | "masculino">("todos");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [falando, setFalando] = useState<{ slug: string; visema: Visema } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (pronto && estado.idioma) setIdioma(estado.idioma);
  }, [pronto, estado.idioma]);

  const lista = TUTORES.filter((t) => t.idioma === idioma && (genero === "todos" || t.genero === genero));
  const tutor = TUTORES.find((t) => t.slug === escolhido);

  function ouvir(t: TutorDemo) {
    clearInterval(timer.current);
    try {
      const u = new SpeechSynthesisUtterance(t.saudacao);
      u.lang = TTS[t.idioma];
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {}
    let i = 0;
    timer.current = setInterval(() => {
      if (i > t.saudacao.length) {
        clearInterval(timer.current);
        return setFalando(null);
      }
      setFalando({ slug: t.slug, visema: visemaDeLetra(t.saudacao[i++] ?? " ") });
    }, 70);
  }

  const nivel = estado.nivel ?? "A1";
  return (
    <OnboardingShell passo={5} voltar="/comecar/nivel">
      <section className="card bg-brand-soft">
        <p className="text-sm font-bold text-brand">Seu nível estimado</p>
        <p className="text-3xl font-extrabold">{nivel}</p>
        <p className="mt-1 text-sm">{CEFR_DESCRICAO[nivel]}</p>
        {(estado.nivelConfianca ?? 1) < 0.6 && <p className="mt-2 text-sm text-ink-soft">Vamos ajustar seu nível nas primeiras aulas.</p>}
      </section>

      <h1 className="mt-6 text-2xl font-extrabold">Escolha seu tutor</h1>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtros">
        {(Object.keys(LANGUAGES) as LangCode[]).map((l) => (
          <button key={l} className="chip" aria-pressed={idioma === l} onClick={() => setIdioma(l)}>{LANGUAGES[l].bandeira} {LANGUAGES[l].nome.split(" ")[0]}</button>
        ))}
        {(["todos", "feminino", "masculino"] as const).map((g) => (
          <button key={g} className="chip" aria-pressed={genero === g} onClick={() => setGenero(g)}>
            {g === "todos" ? "Todos" : g === "feminino" ? "Mulheres" : "Homens"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {lista.map((t) => (
          <div key={t.slug} className={`card flex flex-col items-center p-3 text-center ${escolhido === t.slug ? "border-brand ring-2 ring-brand" : ""}`}>
            <button onClick={() => setEscolhido(t.slug)} className="w-full" aria-pressed={escolhido === t.slug} aria-label={`Escolher ${t.nome}`}>
              <div className="mx-auto h-32 w-28 overflow-hidden rounded-2xl bg-surface-2">
                <TutorCharacter visual={t.visual} nome={t.nome} estado={falando?.slug === t.slug ? "falando" : "repouso"} visema={falando?.slug === t.slug ? falando.visema : 0} className="h-full w-full" />
              </div>
              <p className="mt-2 font-extrabold">{t.nome}</p>
              <p className="text-xs text-ink-soft">Sotaque {t.sotaque}</p>
              <p className="text-xs text-ink-soft">{t.estilo}</p>
            </button>
            <button className="mt-2 min-h-11 text-sm font-bold text-brand" onClick={() => ouvir(t)}>▶ Ouvir voz</button>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 mt-auto bg-bg pb-2 pt-6">
        <button className="btn-primary w-full" disabled={!tutor} onClick={async () => { await salvarTutorNoPerfil(tutor!.slug, idioma); atualizar({ tutorSlug: tutor!.slug, idioma, passo: "/comecar/planos" }); router.push("/comecar/planos"); }}>
          {tutor ? `Começar com ${tutor.nome}` : "Escolha um tutor"}
        </button>
      </div>
    </OnboardingShell>
  );
}

/** Com aluno logado, grava o tutor escolhido no perfil (RLS permite ao aluno alterar tutor_id do próprio perfil). */
async function salvarTutorNoPerfil(slug: string, idioma: LangCode) {
  const sb = supabaseBrowser();
  if (!sb) return;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return;
  const { data: t } = await sb.from("tutors").select("id").eq("slug", slug).maybeSingle();
  if (t) await sb.from("profiles").update({ tutor_id: t.id }).eq("user_id", u.user.id).eq("target_language", idioma);
}
