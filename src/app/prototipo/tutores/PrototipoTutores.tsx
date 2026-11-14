"use client";
import { useState } from "react";
import TutorFoto from "@/components/TutorFoto";
import type { EstadoVoz, Expressao } from "@/components/TutorCharacter";
import { useLipSyncElemento } from "@/lib/client/useLipSync";
import type { Visema } from "@/lib/domain/lipsync";

const TUTORES: { slug: string; nome: string; idioma: string; fala: string; audio?: string }[] = [
  { slug: "maya-cartoon", nome: "Maya (cartoon)", idioma: "Inglês · teste do estilo cartoon 3D", fala: "Hi! I'm Maya. Ready to chat? Tell me, what did you do last weekend?", audio: "maya" },
  { slug: "camille", nome: "Camille", idioma: "Francês · sotaque parisiense", fala: "Bonjour ! Je suis Camille. On discute un peu ? Dis-moi, qu'est-ce que tu aimes faire le week-end ?" },
  { slug: "maya", nome: "Maya", idioma: "Inglês · sotaque americano", fala: "Hi! I'm Maya. Ready to chat? Tell me, what did you do last weekend?" },
  { slug: "oliver", nome: "Oliver", idioma: "Inglês · sotaque britânico", fala: "Hello there, I'm Oliver. Shall we begin? Take your time, there's no rush." },
  { slug: "grace", nome: "Grace", idioma: "Inglês · sotaque americano", fala: "Hey, I'm Grace! So, you've got an interview coming up? Great. Let's practice. Tell me about a project you're really proud of." },
  { slug: "lucia", nome: "Lucía", idioma: "Espanhol · sotaque mexicano", fala: "¡Hola! Soy Lucía. ¿Platicamos un ratito? Cuéntame qué te gusta comer." },
  { slug: "mateo", nome: "Mateo", idioma: "Espanhol · sotaque espanhol", fala: "¡Hola! Soy Mateo. ¡Vamos a hablar! Dime, ¿por qué quieres aprender español?" },
  { slug: "bia", nome: "Bia", idioma: "Português · sotaque paulista", fala: "Oi! Eu sou a Bia. Vamos conversar? Me conta o que você fez hoje." },
  { slug: "caio", nome: "Caio", idioma: "Português · sotaque carioca", fala: "E aí! Sou o Caio. Bora praticar? Me fala de um lugar que você curte." },
  { slug: "helena", nome: "Helena", idioma: "Português · sotaque mineiro", fala: "Olá! Eu sou a Helena. Vamos com calma, tá? Me conta um pouquinho de você: o que você gosta de fazer quando tem um tempo livre?" },
];

function Cartao({ t }: { t: (typeof TUTORES)[number] }) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { visema, tocando } = useLipSyncElemento(audio);
  const [estadoManual, setEstadoManual] = useState<EstadoVoz>("repouso");
  const [expressao, setExpressao] = useState<Expressao>("neutra");
  const [teste, setTeste] = useState<Visema | null>(null);
  const estado: EstadoVoz = tocando || teste !== null ? "falando" : estadoManual;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="overflow-hidden rounded-3xl bg-[#efe3d3]">
        <TutorFoto slug={t.slug} nome={t.nome} estado={estado} visema={teste ?? visema} expressao={expressao} className="aspect-square w-full" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">{t.nome}</h2>
          <p className="text-sm text-white/60">{t.idioma}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${estado === "falando" ? "bg-[#18A957] text-[#06210F]" : "bg-white/10 text-white/70"}`}>{estado}</span>
      </div>
      <audio ref={setAudio} src={`/tutores/audio/${t.audio ?? t.slug}.mp3`} preload="auto" crossOrigin="anonymous" />
      <button className="mt-4 min-h-12 w-full rounded-2xl bg-[#18A957] font-extrabold text-[#06210F] hover:brightness-110" onClick={() => { if (!audio) return; audio.currentTime = 0; void audio.play(); }}>
        ▶ Ouvir {t.nome} (voz da OpenAI)
      </button>
      <p className="mt-3 text-sm italic text-white/60">“{t.fala}”</p>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className="w-24 pt-2 text-white/50">Estado</span>
          {(["repouso", "ouvindo", "pensando"] as const).map((e) => (
            <button key={e} onClick={() => setEstadoManual(e)} className={`min-h-10 rounded-full border px-3 ${estadoManual === e ? "border-[#18A957] bg-[#18A957]/15" : "border-white/15"}`}>{e}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-24 pt-2 text-white/50">Expressão</span>
          {(["neutra", "sorriso", "duvida"] as const).map((e) => (
            <button key={e} onClick={() => setExpressao(e)} className={`min-h-10 rounded-full border px-3 ${expressao === e ? "border-[#18A957] bg-[#18A957]/15" : "border-white/15"}`}>{e === "duvida" ? "surpresa" : e === "sorriso" ? "feliz" : e}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-24 pt-2 text-white/50">Bocas</span>
          {(["A", "E/I", "O", "U", "M/B/P", "F/V"] as const).map((n, i) => {
            const v = (i + 1) as Visema;
            return <button key={n} onPointerDown={() => setTeste(v)} onPointerUp={() => setTeste(null)} onPointerLeave={() => setTeste(null)} className={`min-h-10 rounded-full border px-3 ${teste === v ? "border-[#FFC83D] bg-[#FFC83D]/15" : "border-white/15"}`}>{n}</button>;
          })}
        </div>
      </div>
    </section>
  );
}

/** Protótipo: tutores em foto (Grok) com boca sincronizada pela voz, piscar e expressões. */
export default function PrototipoTutores() {
  return (
    <main className="min-h-dvh bg-[#0B1220] px-4 py-10 text-[#F8FAFC]">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#18A957]">Protótipo</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Os 8 tutores, falando de verdade</h1>
        <p className="mt-3 max-w-3xl text-white/70">
          Toque em “Ouvir”: a boca acompanha a voz gerada pela OpenAI, analisada no navegador do mesmo jeito que na aula ao vivo.
          Só a boca e os olhos trocam; o resto do retrato fica parado. Segure os botões de “Bocas” para ver cada posição.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {TUTORES.map((t) => <Cartao key={t.slug} t={t} />)}
        </div>
        <p className="mt-6 text-sm text-white/50">Personagens de IA. Fotos geradas por IA; não retratam pessoas reais.</p>
      </div>
    </main>
  );
}
