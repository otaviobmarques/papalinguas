"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import OnboardingShell from "@/components/OnboardingShell";
import TutorCharacter from "@/components/TutorCharacter";
import { useOnboarding } from "@/lib/client/onboarding";
import { useLipSyncElemento } from "@/lib/client/useLipSync";
import { recarregarAluno, useAluno } from "@/lib/client/aluno";
import { TUTORES, type TutorDemo } from "@/lib/demo/data";
import { CEFR_DESCRICAO, LANGUAGES, type LangCode } from "@/lib/domain/types";

/** O7. Resultado e escolha do tutor. Com ?voltar=/app/... vira a tela "Trocar tutor" do app (sem etapas do cadastro). */
function EscolhaTutor() {
  const { estado, atualizar, pronto } = useOnboarding();
  const router = useRouter();
  const voltar = useSearchParams().get("voltar");
  const trocando = !!voltar && voltar.startsWith("/app");
  const { aluno } = useAluno();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [idioma, setIdioma] = useState<LangCode>("en");
  const [genero, setGenero] = useState<"todos" | "feminino" | "masculino">("todos");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  // Amostra da voz real do tutor (a mesma da aula), com a boca sincronizada pelo áudio
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState<string | null>(null);
  const { visema } = useLipSyncElemento(audio);
  const falando = tocando ? { slug: tocando, visema } : null;

  useEffect(() => {
    if (!audio) return;
    const fim = () => setTocando(null);
    audio.addEventListener("ended", fim);
    return () => audio.removeEventListener("ended", fim);
  }, [audio]);

  // começa no idioma que o aluno estuda (do servidor, se logado) e com o tutor atual marcado
  useEffect(() => {
    const atual = aluno?.perfil?.idioma ?? (pronto ? estado.idioma : undefined);
    if (atual) setIdioma(atual);
    const tutorAtual = aluno?.perfil?.tutorSlug ?? estado.tutorSlug;
    if (trocando && tutorAtual) setEscolhido((e) => e ?? tutorAtual);
  }, [aluno, pronto, estado.idioma, estado.tutorSlug, trocando]);

  async function confirmar() {
    if (!tutor) return;
    setErro(null);
    setSalvando(true);
    try {
      if (aluno) {
        const r = await fetch("/api/perfil/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: tutor.slug }) });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.mensagem ?? "Não foi possível trocar o tutor agora.");
        }
        recarregarAluno();
      }
      const destino = trocando ? voltar! : "/comecar/planos";
      atualizar({ tutorSlug: tutor.slug, idioma: tutor.idioma, ...(trocando ? {} : { passo: "/comecar/planos" }) });
      router.push(destino);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível trocar o tutor agora.");
      setSalvando(false);
    }
  }

  const lista = TUTORES.filter((t) => t.idioma === idioma && (genero === "todos" || t.genero === genero));
  const tutor = TUTORES.find((t) => t.slug === escolhido);

  function ouvir(t: TutorDemo) {
    if (!audio) return;
    if (tocando === t.slug) {
      audio.pause();
      setTocando(null);
      return;
    }
    audio.src = `/tutores/audio/${t.slug}.mp3`;
    audio.currentTime = 0;
    setTocando(t.slug);
    void audio.play().catch(() => setTocando(null));
  }

  const nivel = estado.nivel ?? "A1";
  return (
    <OnboardingShell passo={trocando ? undefined : 5} voltar={trocando ? voltar! : "/comecar/nivel"}>
      {trocando ? (
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight">Trocar tutor</h1>
          <p className="mt-1 text-sm text-ink-soft">Escolher um tutor de outro idioma muda o idioma que você estuda. Seu progresso em cada idioma fica guardado.</p>
        </header>
      ) : (
      <section className="card bg-brand-soft">
        <p className="text-sm font-bold text-brand">Seu nível estimado</p>
        <p className="text-3xl font-extrabold">{nivel}</p>
        <p className="mt-1 text-sm">{estado.nivelResumo || CEFR_DESCRICAO[nivel]}</p>
        {(estado.nivelConfianca ?? 1) < 0.6 && <p className="mt-2 text-sm text-ink-soft">Vamos ajustar seu nível nas primeiras aulas.</p>}
      </section>
      )}

      {!trocando && <h1 className="mt-6 text-2xl font-extrabold">Escolha seu tutor</h1>}
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
                <TutorCharacter slug={t.slug} enquadramento="preencher" visual={t.visual} nome={t.nome} estado={falando?.slug === t.slug ? "falando" : "repouso"} visema={falando?.slug === t.slug ? falando.visema : 0} className="h-full w-full" />
              </div>
              <p className="mt-2 font-extrabold">{t.nome}</p>
              <p className="text-xs text-ink-soft">Sotaque {t.sotaque}</p>
              <p className="text-xs text-ink-soft">{t.estilo}</p>
            </button>
            <button className="mt-2 min-h-11 text-sm font-bold text-brand" onClick={() => ouvir(t)} aria-pressed={tocando === t.slug}>{tocando === t.slug ? "■ Parar" : "▶ Ouvir voz"}</button>
          </div>
        ))}
      </div>

      <audio ref={setAudio} preload="none" crossOrigin="anonymous" />
      <div className="sticky bottom-0 mt-auto bg-bg pb-2 pt-6">
        {erro && <p role="alert" className="mb-2 text-sm font-semibold text-danger">{erro}</p>}
        <button className="btn-primary w-full" disabled={!tutor || salvando} onClick={confirmar}>
          {salvando ? "Salvando…" : tutor ? (trocando ? `Conversar com ${tutor.nome}` : `Começar com ${tutor.nome}`) : "Escolha um tutor"}
        </button>
      </div>
    </OnboardingShell>
  );
}

export default function Page() {
  return <Suspense><EscolhaTutor /></Suspense>;
}
