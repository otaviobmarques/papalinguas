import type { Metadata } from "next";
import Link from "next/link";
import Mascote from "@/components/marca/Mascote";
import CookieBanner from "@/components/site/CookieBanner";
import DemoPlayer from "@/components/site/DemoLazy";
import { Contador, HolofoteGlobal } from "@/components/site/Efeitos";
import Icone from "@/components/site/Icone";
import PlanosSite from "@/components/site/PlanosSite";
import Reveal from "@/components/site/Reveal";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import TutoresSite from "@/components/site/TutoresSite";
import { PLANOS } from "@/lib/domain/plans";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE.titulo },
  description: SITE.descricao,
  alternates: { canonical: "/" },
};

const SAUDACOES = ["Hello!", "¡Hola!", "Olá!", "How are you?", "¿Qué tal?", "Tudo bem?", "Nice to meet you", "Mucho gusto", "Prazer!", "Let's talk", "Hablemos", "Bora conversar?"];

const RECURSOS = [
  { icone: "voz", titulo: "Conversa em tempo real", texto: "O tutor responde em cerca de um segundo, com voz natural. Pediu para ir mais devagar? Ele vai." },
  { icone: "traduzir", titulo: "Tradução e dica na hora", texto: "Travou? Um toque mostra a última frase em português ou sugere o que responder." },
  { icone: "relatorio", titulo: "Relatório depois de cada aula", texto: "Gramática, vocabulário novo e as palavras que você pode pronunciar melhor, com explicação curta." },
  { icone: "revisao", titulo: "Revisão espaçada", texto: "O app avisa a hora certa de revisar, antes de você esquecer. A revisão não gasta minutos." },
  { icone: "acolher", titulo: "Modo Acolher", texto: "Frases curtas, sem nota e sem pressa, para quem prefere aprender no próprio ritmo." },
];

const OBJETIVOS = [
  { icone: "carreira", t: "Entrevistas e carreira", d: "Simule entrevistas, reuniões e pedidos de aumento antes do dia real." },
  { icone: "viagem", t: "Viagem", d: "Aeroporto, hotel, restaurante e imprevistos, sem travar." },
  { icone: "prova", t: "Provas de proficiência", d: "Treine a parte oral com retorno de pronúncia." },
  { icone: "casa", t: "Morar fora", d: "Aluguel, banco, médico e conversa com os vizinhos." },
  { icone: "conversa", t: "Conversar melhor", d: "Perder a vergonha de falar é o primeiro passo." },
];

const CONFIANCA = [
  { icone: "cadeado", t: "Seus dados protegidos", d: "Tratamento conforme a LGPD. O áudio bruto é apagado em 30 dias; você baixa ou apaga seus dados quando quiser." },
  { icone: "escudo", t: "Garantia de 7 dias", d: "Na primeira assinatura, desistiu em até 7 dias? Devolvemos o valor integral." },
  { icone: "relogio", t: "Cancele quando quiser", d: "Sem multa e sem ligação: peça pelo app ou por e-mail. Você mantém o acesso até o fim do período pago." },
];

const FAQ = [
  { p: "Os tutores são pessoas?", r: "Não. Os tutores são personagens de inteligência artificial, com fotos geradas por IA, vozes e estilos diferentes. Por isso você pode praticar a qualquer hora, sem agendar e sem vergonha de errar." },
  { p: "Tem versão gratuita?", r: "Não temos plano gratuito, mas o teste de nível é grátis: uma conversa de cerca de 3 minutos, antes de assinar. E a primeira assinatura tem garantia de 7 dias com devolução integral." },
  { p: "Como funciona a garantia de 7 dias?", r: `Na primeira assinatura, se você desistir em até 7 dias, devolvemos o valor integral. Basta pedir pela tela da sua assinatura ou pelo e-mail ${SITE.contato}.` },
  { p: "Quantos minutos de conversa eu tenho?", r: `O Essencial inclui ${PLANOS.essencial.minutosCiclo} minutos por mês (cerca de 5 por dia) e o Fluente, ${PLANOS.fluente.minutosCiclo} minutos (cerca de 10 por dia). A revisão de cartões não gasta minutos. Se acabar, existe o pacote extra.` },
  { p: "Posso cancelar quando quiser?", r: "Sim, sem multa. Você pede o cancelamento pelo app ou por e-mail e continua com acesso até o fim do período já pago." },
  { p: "O que acontece com a minha voz?", r: "Sua voz é usada só para a conversa e para avaliar a pronúncia. Guardamos a transcrição para seus relatórios; o áudio bruto é apagado automaticamente em 30 dias. Você pode baixar ou apagar seus dados quando quiser." },
  { p: "Quais idiomas posso aprender?", r: "Inglês, espanhol, francês, italiano, alemão, japonês e português para estrangeiros. O plano Essencial inclui um idioma por vez (dá para trocar) e o Fluente permite estudar até 3 idiomas." },
  { p: "Funciona no celular?", r: "Sim. O Papalinguas funciona no navegador do celular ou do computador e pode ser instalado na tela inicial, como um app." },
  { p: "Precisa ter 18 anos?", r: "Sim. Neste momento o Papalinguas é exclusivo para maiores de 18 anos." },
];

function jsonLd() {
  const ofertas = Object.values(PLANOS).flatMap((p) =>
    (["mensal", "anual"] as const).map((per) => ({
      "@type": "Offer", name: `${p.nome} ${per}`, price: (p.precos[per] / 100).toFixed(2), priceCurrency: "BRL", url: `${SITE.url}/#planos`, availability: "https://schema.org/InStock",
    })),
  );
  return [
    { "@context": "https://schema.org", "@type": "Organization", name: SITE.nome, url: SITE.url, logo: `${SITE.url}/icon-512.png`, legalName: SITE.empresa, email: SITE.contato },
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE.nome, url: SITE.url, inLanguage: "pt-BR" },
    { "@context": "https://schema.org", "@type": "Product", name: "Papalinguas", description: SITE.descricao, brand: { "@type": "Brand", name: SITE.nome }, image: `${SITE.url}/opengraph-image.jpg`, offers: ofertas },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })) },
  ];
}

function Titulo({ selo, titulo, texto, centro = true }: { selo: string; titulo: React.ReactNode; texto?: string; centro?: boolean }) {
  return (
    <Reveal className={centro ? "text-center" : ""}>
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">{selo}</p>
      <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">{titulo}</h2>
      {texto && <p className={`mt-4 max-w-2xl text-lg text-ink-soft ${centro ? "mx-auto" : ""}`}>{texto}</p>}
    </Reveal>
  );
}

export default function Site() {
  return (
    <div className="tema-escuro min-h-dvh overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }} />
      <HolofoteGlobal />
      <SiteHeader />

      <main id="conteudo">
        {/* HERO */}
        <section className="relative -mt-16 pt-16 sm:-mt-[72px] sm:pt-[72px]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="aurora absolute -left-40 -top-40 size-[44rem] rounded-full bg-[radial-gradient(circle,rgba(24,169,87,.32),transparent_62%)]" />
            <div className="aurora absolute -right-52 top-24 size-[40rem] rounded-full bg-[radial-gradient(circle,rgba(47,128,237,.26),transparent_62%)] [animation-delay:-6s]" />
            <div className="aurora absolute bottom-0 left-1/3 size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(255,200,61,.10),transparent_62%)] [animation-delay:-11s]" />
            <div className="grade-fundo absolute inset-0" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-16">
            <div>
              <Reveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-ink-soft backdrop-blur">
                  <span className="size-2 rounded-full bg-brand shadow-[0_0_12px_#18a957]" /> Inglês · Espanhol · Francês · Italiano · Alemão · Japonês
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="mt-6 text-balance text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                  Fale outro idioma <span className="texto-gradiente">sem medo de errar.</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
                  Converse por voz com um tutor de IA, a qualquer hora, sobre o que importa para você: entrevista, viagem, trabalho ou só conversar.
                  Correção gentil na hora, relatório depois e revisão do que você errou.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link href="/comecar" className="btn-primary group min-h-14 rounded-full px-8 text-lg shadow-[0_12px_40px_-10px_rgba(24,169,87,.7)]">
                    Fazer o teste de nível grátis <Icone nome="seta" className="size-5 transition group-hover:translate-x-1" />
                  </Link>
                  <a href="#como-funciona" className="btn min-h-14 rounded-full border border-white/15 px-8 text-lg text-ink hover:bg-white/5">Como funciona</a>
                </div>
                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
                  {["3 minutos, por voz", "Sem cartão", "Garantia de 7 dias na assinatura"].map((t) => (
                    <li key={t} className="inline-flex items-center gap-2"><Icone nome="check" className="size-4 text-brand" />{t}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={200} className="relative mx-auto w-full max-w-[440px]">
              <DemoPlayer />
              <div className="pointer-events-none absolute -left-12 bottom-0 hidden w-28 sm:block lg:-left-[4.5rem]">
                <Mascote pose="acenando" className="w-full drop-shadow-2xl" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAIXA DE SAUDAÇÕES */}
        <section aria-hidden className="relative overflow-hidden border-y border-white/5 bg-white/[0.02] py-6">
          <div className="faixa-rolante flex w-max gap-12 whitespace-nowrap text-2xl font-extrabold tracking-tight text-white/25 sm:text-3xl">
            {[...SAUDACOES, ...SAUDACOES].map((s, i) => <span key={i} className={i % 4 === 1 ? "text-brand/60" : ""}>{s}</span>)}
          </div>
        </section>

        {/* NÚMEROS */}
        <section aria-label="Destaques" className="mx-auto max-w-6xl px-4 py-16">
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
            {[
              [<Contador key="i" ate={7} />, "idiomas"],
              [<Contador key="t" ate={16} />, "tutores com sotaques e estilos diferentes"],
              ["A1 → C1", "do zero ao avançado"],
              [<Contador key="g" ate={7} sufixo=" dias" />, "de garantia na primeira assinatura"],
            ].map(([n, t], i) => (
              <li key={i} className="bg-bg p-6 text-center sm:p-8">
                <span className="block text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{n}</span>
                <span className="mt-1 block text-sm text-ink-soft">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:py-24">
          <Titulo selo="Como funciona" titulo="Aprender falando, desde o primeiro minuto" texto="Nada de decorar listas. Você conversa, o tutor ajusta o nível e o app guarda o que você precisa revisar." />
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            <Reveal delay={0}>
              <li className="holofote h-full rounded-3xl border border-line bg-surface p-7">
                <span className="text-sm font-bold text-brand">01</span>
                <h3 className="mt-3 text-xl font-extrabold">Descubra seu nível</h3>
                <p className="mt-2 text-ink-soft">Uma conversa de 3 minutos, grátis. O tutor ajusta as perguntas e mostra seu nível e o que você já consegue fazer.</p>
                <div className="mt-6 flex gap-1.5" aria-hidden>
                  {["A1", "A2", "B1", "B2", "C1"].map((n, i) => (
                    <span key={n} className={`flex-1 rounded-lg py-2 text-center text-xs font-bold ${i < 3 ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink-soft"} ${i === 2 ? "ring-2 ring-sun ring-offset-2 ring-offset-surface" : ""}`}>{n}</span>
                  ))}
                </div>
              </li>
            </Reveal>
            <Reveal delay={120}>
              <li className="holofote h-full rounded-3xl border border-line bg-surface p-7">
                <span className="text-sm font-bold text-brand">02</span>
                <h3 className="mt-3 text-xl font-extrabold">Converse por voz, de verdade</h3>
                <p className="mt-2 text-ink-soft">Escolha o tutor e o cenário: entrevista, aeroporto, reunião ou conversa livre. Interrompa quando quiser, como numa conversa real.</p>
                <div className="mt-6 flex h-9 items-center gap-1" aria-hidden>
                  {Array.from({ length: 28 }, (_, i) => <span key={i} className="w-1.5 flex-1 rounded-full bg-brand/70" style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 80}%` }} />)}
                </div>
              </li>
            </Reveal>
            <Reveal delay={240}>
              <li className="holofote h-full rounded-3xl border border-line bg-surface p-7">
                <span className="text-sm font-bold text-brand">03</span>
                <h3 className="mt-3 text-xl font-extrabold">Veja o que melhorar e revise</h3>
                <p className="mt-2 text-ink-soft">Depois de cada aula, um relatório mostra o que dizer melhor. Os erros viram cartões de revisão para você não esquecer.</p>
                <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-3 text-sm" aria-hidden>
                  <span className="text-ink-soft line-through decoration-accent">I lead the team</span> <Icone nome="seta" className="mx-1 inline size-4 text-ink-soft" /> <b className="text-sun">I led the team</b>
                </div>
              </li>
            </Reveal>
          </ol>
        </section>

        {/* RECURSOS (bento) */}
        <section className="relative py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
          <div className="mx-auto max-w-6xl px-4">
            <Titulo selo="Recursos" titulo="Tudo o que uma boa aula de conversação tem" texto="E o que ela não tem: disponível 24 horas, sem agendar e sem julgamento." />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              <Reveal className="lg:row-span-2">
                <div className="holofote flex h-full flex-col rounded-3xl border border-line bg-gradient-to-b from-brand/15 to-surface p-7">
                  <Icone nome="correcao" className="size-7 text-brand" />
                  <h3 className="mt-4 text-2xl font-extrabold">Correção sem constrangimento</h3>
                  <p className="mt-2 text-ink-soft">Nada de “errado”. O tutor repete a frase certa no meio da conversa, como um bom professor faria. Você escolhe a correção leve ou detalhada.</p>
                  <div className="mt-8 space-y-3 text-[15px]" aria-hidden>
                    <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-3 font-semibold text-brand-ink">Yesterday I go to the airport and my flight was delay.</p>
                    <p className="max-w-[90%] rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3">Oh no! So yesterday you <b className="text-sun">went</b> to the airport and your flight was <b className="text-sun">delayed</b>? What happened next?</p>
                  </div>
                </div>
              </Reveal>
              {RECURSOS.map((r, i) => {
                const largo = i === RECURSOS.length - 1; // o último fecha a grade numa faixa inteira
                return (
                  <Reveal key={r.titulo} delay={(i % 2) * 100} className={largo ? "lg:col-span-3" : ""}>
                    <div className={`holofote h-full rounded-3xl border border-line bg-surface p-7 ${largo ? "sm:flex sm:items-center sm:gap-6" : ""}`}>
                      <Icone nome={r.icone} className="size-7 shrink-0 text-brand" />
                      <div>
                        <h3 className={`text-lg font-extrabold ${largo ? "mt-4 sm:mt-0" : "mt-4"}`}>{r.titulo}</h3>
                        <p className="mt-2 text-ink-soft">{r.texto}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* TUTORES */}
        <section id="tutores" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:py-24">
          <Titulo selo="Tutores" titulo="Escolha quem vai conversar com você" texto="Sotaques de Nova York a Tóquio, de Paris a Montreal, de Roma a Berlim. Calmo, animado, direto ou focado em carreira: tem um tutor do seu jeito." />
          <div className="mt-12"><TutoresSite /></div>
        </section>

        {/* OBJETIVOS */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Titulo selo="Para o seu objetivo" titulo="Aulas pensadas para a sua vida real" />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {OBJETIVOS.map((o, i) => (
                <Reveal key={o.t} delay={i * 70}>
                  <li className="holofote h-full rounded-3xl border border-line bg-surface p-6 transition hover:-translate-y-1">
                    <span className="grid size-12 place-items-center rounded-2xl bg-brand/12 text-brand"><Icone nome={o.icone} /></span>
                    <p className="mt-4 font-extrabold">{o.t}</p>
                    <p className="mt-1 text-sm text-ink-soft">{o.d}</p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* MASCOTE */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-gradient-to-br from-surface to-[#0d2a1d] p-8 sm:p-14">
            <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(circle,rgba(255,200,61,.18),transparent_65%)]" aria-hidden />
            <div className="relative grid items-center gap-10 md:grid-cols-[0.8fr_1.2fr]">
              <Reveal className="mx-auto w-52 sm:w-64"><Mascote titulo="Mascote do Papalinguas, um papagaio verde de testa azul e rosto amarelo" className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.45)]" /></Reveal>
              <div>
                <Titulo centro={false} selo="Seu parceiro de estudo" titulo="Um papagaio que torce por você" texto="O mascote do Papalinguas acompanha sua sequência de dias, comemora suas conquistas e lembra a hora de revisar. Sem pressão e sem notificações demais." />
                <Reveal delay={150}>
                  <ul className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
                    <li className="rounded-full bg-sun/15 px-4 py-2 text-sun">7 dias seguidos</li>
                    <li className="rounded-full bg-sky/15 px-4 py-2 text-sky">12 cartões para revisar</li>
                    <li className="rounded-full bg-brand/15 px-4 py-2 text-[#5ee29b]">Conquista: primeira entrevista</li>
                  </ul>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* CONFIANÇA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Titulo selo="Confiança" titulo="Sério com o que é seu" texto={`Um produto da ${SITE.empresa}, empresa brasileira (CNPJ ${SITE.cnpj}).`} />
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {CONFIANCA.map((c, i) => (
              <Reveal key={c.t} delay={i * 100}>
                <li className="holofote h-full rounded-3xl border border-line bg-surface p-7">
                  <Icone nome={c.icone} className="size-7 text-brand" />
                  <h3 className="mt-4 text-lg font-extrabold">{c.t}</h3>
                  <p className="mt-2 text-ink-soft">{c.d}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* PLANOS */}
        <section id="planos" className="relative scroll-mt-24 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute left-1/2 top-1/3 size-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(24,169,87,.14),transparent_65%)]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4">
            <Titulo selo="Planos" titulo="Planos simples, sem surpresa" texto="Comece pelo teste de nível grátis. Assine só se gostar, e ainda tem 7 dias para desistir com devolução integral." />
            <div className="mt-12"><PlanosSite /></div>
          </div>
        </section>

        {/* FAQ */}
        <section id="perguntas" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16 sm:py-24">
          <Titulo selo="Perguntas frequentes" titulo="Ficou alguma dúvida?" />
          <div className="mt-12 divide-y divide-line rounded-3xl border border-line bg-surface">
            {FAQ.map((f) => (
              <details key={f.p} className="group">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-bold">
                  {f.p}<span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-brand transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="px-6 pb-6 leading-relaxed text-ink-soft">{f.r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-brand/30 bg-[radial-gradient(ellipse_at_top,rgba(24,169,87,.35),transparent_60%),#0d1628] px-6 py-16 text-center sm:py-20">
              <div className="mx-auto w-28"><Mascote pose="acenando" className="w-full" /></div>
              <h2 className="mt-6 text-balance text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">Seu próximo idioma começa com uma conversa.</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">Descubra seu nível em 3 minutos e conheça seu tutor. Grátis, por voz, sem cartão.</p>
              <Link href="/comecar" className="btn-primary group mt-9 min-h-14 rounded-full px-9 text-lg">
                Fazer o teste de nível grátis <Icone nome="seta" className="size-5 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
      <CookieBanner />
    </div>
  );
}
