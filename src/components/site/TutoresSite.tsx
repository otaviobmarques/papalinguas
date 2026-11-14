"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import TutorCharacter from "@/components/TutorCharacter";
import TutorFoto from "@/components/TutorFoto";
import { useLipSyncElemento } from "@/lib/client/useLipSync";
import { TUTORES } from "@/lib/demo/data";
import { LANGUAGES, type LangCode } from "@/lib/domain/types";
import { fotoDoTutor, temFotoAnimada } from "@/lib/tutores/fotos";
import Icone from "./Icone";

const BANDEIRA: Record<string, string> = { parisiense: "🇫🇷", quebequense: "🇨🇦", romano: "🇮🇹", "milanês": "🇮🇹", berlinense: "🇩🇪", muniquense: "🇩🇪", "de Tóquio": "🇯🇵", "de Pequim": "🇨🇳", "de Xangai": "🇨🇳", americano: "🇺🇸", britânico: "🇬🇧", mexicano: "🇲🇽", espanhol: "🇪🇸", paulista: "🇧🇷", carioca: "🇧🇷", mineiro: "🇧🇷" };

/** Tutores do site: foto, sotaque, estilo e a voz real (amostra gerada pela OpenAI). */
export default function TutoresSite() {
  const [idioma, setIdioma] = useState<LangCode | "todos">("todos");
  const [tocando, setTocando] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { visema } = useLipSyncElemento(audio);
  // Em "Todos", só quem já tem foto (os tutores novos aparecem ao escolher o idioma, com o desenho provisório)
  const lista = TUTORES.filter((t) => (idioma === "todos" ? !!fotoDoTutor(t.slug) : t.idioma === idioma));

  useEffect(() => {
    if (!audio) return;
    const fim = () => setTocando(null);
    audio.addEventListener("ended", fim);
    return () => audio.removeEventListener("ended", fim);
  }, [audio]);

  function ouvir(slug: string) {
    if (!audio) return;
    if (tocando === slug) {
      audio.pause();
      setTocando(null);
      return;
    }
    audio.src = `/tutores/audio/${slug}.mp3`;
    audio.currentTime = 0;
    setTocando(slug);
    void audio.play().catch(() => setTocando(null));
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por idioma">
        {(["todos", ...Object.keys(LANGUAGES)] as const).map((l) => (
          <button key={l} type="button" aria-pressed={idioma === l} onClick={() => setIdioma(l as LangCode | "todos")}
            className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition ${idioma === l ? "border-brand bg-brand/15 text-ink" : "border-line text-ink-soft hover:text-ink"}`}>
            {l === "todos" ? "Todos" : LANGUAGES[l as LangCode].nome.split(" ")[0]}
          </button>
        ))}
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {lista.map((t) => {
          const fala = tocando === t.slug;
          const foto = fotoDoTutor(t.slug);
          return (
            <li key={t.slug} className="holofote group overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-white/20">
              <div className="relative aspect-square overflow-hidden bg-[#efe3d3]">
                {temFotoAnimada(t.slug) ? (
                  <TutorFoto slug={t.slug} nome={t.nome} estado={fala ? "falando" : "repouso"} visema={fala ? visema : 0} className="absolute inset-0 h-full w-full" />
                ) : foto ? (
                  <Image src={foto.card} alt={`${t.nome}, ${t.genero === "masculino" ? "tutor" : "tutora"} de IA`} fill sizes="(min-width:1024px) 270px, 50vw"
                    className={`object-cover transition duration-700 group-hover:scale-[1.04] ${fala ? "scale-[1.03]" : ""}`} />
                ) : (
                  <TutorCharacter slug={t.slug} visual={t.visual} nome={t.nome} estado={fala ? "falando" : "repouso"} visema={fala ? visema : 0} className="absolute inset-0 h-full w-full" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0b1220]/70 to-transparent" />
                {fala && <span className="pointer-events-none absolute inset-0 rounded-t-3xl ring-4 ring-inset ring-brand/70 anim-ring" aria-hidden />}
                <span className="absolute left-3 top-3 rounded-full bg-[#0b1220]/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  {BANDEIRA[t.sotaque]} {LANGUAGES[t.idioma].nome.split(" ")[0]}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-lg font-extrabold">{t.nome}</p>
                  <p className="text-xs text-ink-soft">sotaque {t.sotaque}</p>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{t.estilo[0].toUpperCase() + t.estilo.slice(1)}. {t.bio}</p>
                <button type="button" onClick={() => ouvir(t.slug)} aria-pressed={fala}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">
                  <Icone nome={fala ? "fechar" : "som"} className="size-4" /> {fala ? "Parar" : `Ouvir ${t.nome}`}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {/* um único <audio> para todos: o navegador só deixa ligar um elemento ao analisador uma vez */}
      <audio ref={setAudio} preload="none" crossOrigin="anonymous" />
      <p className="mt-6 text-center text-xs text-ink-soft">Os tutores são personagens de inteligência artificial; as fotos foram geradas por IA e não retratam pessoas reais. As amostras usam a mesma voz da aula.</p>
    </div>
  );
}

