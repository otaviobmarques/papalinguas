import type { Metadata } from "next";
import Link from "next/link";
import CookieBanner from "@/components/site/CookieBanner";
import HeroTutor from "@/components/site/HeroTutor";
import PhoneFrame from "@/components/site/PhoneFrame";
import PlanosSite from "@/components/site/PlanosSite";
import Reveal from "@/components/site/Reveal";
import TutoresSite from "@/components/site/TutoresSite";
import { PLANOS } from "@/lib/domain/plans";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE.titulo },
  description: SITE.descricao,
  alternates: { canonical: "/" },
};

const PASSOS = [
  { n: "1", titulo: "Faça o teste de nível grátis", texto: "Uma conversa de 3 minutos com um tutor. Ele ajusta as perguntas e diz seu nível, do A1 ao C1, e o que você já consegue fazer." },
  { n: "2", titulo: "Converse por voz, de verdade", texto: "Escolha o tutor e o cenário: entrevista de emprego, aeroporto, reunião, conversa livre. Fale sem medo de errar e interrompa quando quiser." },
  { n: "3", titulo: "Veja o que melhorar e revise", texto: "Depois de cada aula, um relatório mostra o que dizer melhor. Os erros viram cartões de revisão para você nunca mais esquecer." },
];

const RECURSOS = [
  { icone: "🎙️", titulo: "Conversa em tempo real", texto: "O tutor responde em cerca de um segundo, com voz natural. Pediu para ir mais devagar? Ele vai." },
  { icone: "💬", titulo: "Correção sem constrangimento", texto: "Nada de \"errado\". O tutor repete a frase certa na conversa, do jeito que um bom professor faria." },
  { icone: "🇧🇷", titulo: "Traduzir e dica na hora", texto: "Travou? Um toque mostra a última frase em português ou sugere o que responder." },
  { icone: "📊", titulo: "Relatório depois de cada aula", texto: "Gramática, vocabulário novo e as palavras que você pode pronunciar melhor, com explicação curta." },
  { icone: "🔁", titulo: "Revisão espaçada", texto: "O app lembra você de revisar no momento certo, antes de esquecer. Funciona até sem internet." },
  { icone: "🌱", titulo: "Modo Acolher", texto: "Prefere frases curtas, sem nota e sem pressa? Ative o modo que respeita o seu jeito de aprender." },
];

const OBJETIVOS = [
  { e: "💼", t: "Entrevistas e carreira", d: "Simule entrevistas, reuniões e pedidos de aumento antes do dia real." },
  { e: "✈️", t: "Viagem", d: "Aeroporto, hotel, restaurante e imprevistos, sem travar." },
  { e: "📝", t: "Provas de proficiência", d: "Treine a parte oral com feedback de pronúncia." },
  { e: "🏡", t: "Morar fora", d: "Aluguel, banco, médico e conversa com vizinhos." },
  { e: "💬", t: "Conversar melhor", d: "Perder a vergonha de falar é o primeiro passo." },
];

const FAQ = [
  { p: "Os tutores são pessoas?", r: "Não. Os tutores são inteligências artificiais com personagens ilustrados, vozes e estilos diferentes. Por isso você pode praticar a qualquer hora, sem agendar e sem vergonha de errar." },
  { p: "Tem versão gratuita?", r: "Não temos plano gratuito, mas o teste de nível é grátis: uma conversa de cerca de 3 minutos, antes de assinar. E a primeira assinatura tem garantia de 7 dias com devolução integral." },
  { p: "Como funciona a garantia de 7 dias?", r: "Na primeira assinatura, se você desistir em até 7 dias, devolvemos o valor integral. O botão de reembolso fica na tela da sua assinatura, sem perguntas obrigatórias." },
  { p: "Quantos minutos de conversa eu tenho?", r: `O Essencial inclui ${PLANOS.essencial.minutosCiclo} minutos por mês (cerca de 5 por dia) e o Fluente, ${PLANOS.fluente.minutosCiclo} minutos (cerca de 10 por dia). A revisão de cartões não gasta minutos. Se acabar, existe o pacote extra.` },
  { p: "Posso cancelar quando quiser?", r: "Sim. O cancelamento leva no máximo 2 toques e você continua com acesso até o fim do período já pago." },
  { p: "O que acontece com a minha voz?", r: "Sua voz é usada só para a conversa e para avaliar a pronúncia. Guardamos a transcrição para seus relatórios; o áudio bruto é apagado automaticamente em 30 dias. Você pode baixar ou apagar seus dados quando quiser." },
  { p: "Quais idiomas posso aprender?", r: "Inglês, espanhol e português para estrangeiros. O plano Fluente permite estudar até 3 idiomas." },
  { p: "Funciona no celular?", r: "Sim. O Papalinguas funciona no navegador do celular ou do computador e pode ser instalado na tela inicial, como um app. Os apps para iPhone e Android vêm em seguida." },
  { p: "Precisa ter 18 anos?", r: "Sim. Neste momento o Papalinguas é exclusivo para maiores de 18 anos." },
];

function jsonLd() {
  const ofertas = Object.values(PLANOS).flatMap((p) =>
    (["mensal", "anual"] as const).map((per) => ({
      "@type": "Offer",
      name: `${p.nome} ${per}`,
      price: (p.precos[per] / 100).toFixed(2),
      priceCurrency: "BRL",
      url: `${SITE.url}/#planos`,
      availability: "https://schema.org/InStock",
    })),
  );
  return [
    { "@context": "https://schema.org", "@type": "Organization", name: SITE.nome, url: SITE.url, logo: `${SITE.url}/icon.svg`, legalName: SITE.empresa, email: SITE.contato },
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE.nome, url: SITE.url, inLanguage: "pt-BR" },
    {
      "@context": "https://schema.org", "@type": "Product", name: "Papalinguas", description: SITE.descricao, brand: { "@type": "Brand", name: SITE.nome },
      image: `${SITE.url}/opengraph-image`, offers: ofertas,
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })) },
  ];
}

export default function Site() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }} />

      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" width={32} height={32} className="rounded-lg" /> Papalinguas
          </Link>
          <nav aria-label="Seções" className="hidden gap-6 text-sm font-semibold md:flex">
            <a href="#como-funciona" className="hover:text-brand">Como funciona</a>
            <a href="#tutores" className="hover:text-brand">Tutores</a>
            <a href="#planos" className="hover:text-brand">Planos</a>
            <a href="#perguntas" className="hover:text-brand">Perguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/comecar/conta?entrar=1" className="hidden min-h-11 items-center px-3 text-sm font-semibold sm:inline-flex">Entrar</Link>
            <Link href="/comecar" className="btn-primary min-h-11 px-4 py-2 text-sm">Teste grátis</Link>
          </div>
        </div>
      </header>

      <main id="conteudo">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full bg-accent-soft blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-40 -left-40 size-[28rem] rounded-full bg-brand-soft blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
            <div>
              <p className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand">Inglês · Espanhol · Português para estrangeiros</p>
              <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
                Perca o medo de falar outro idioma. <span className="text-brand">Converse com seu tutor de IA.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-ink-soft">
                Aulas por voz, a qualquer hora, sobre o que importa para você: entrevista de emprego, viagem, trabalho ou só conversar.
                Correção gentil na hora, relatório depois e revisão do que você errou.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/comecar" className="btn-primary px-7 text-lg">Fazer o teste de nível grátis</Link>
                <a href="#planos" className="btn-ghost px-7 text-lg">Ver planos</a>
              </div>
              <p className="mt-4 text-sm text-ink-soft">3 minutos, por voz, sem cartão. Garantia de 7 dias na assinatura.</p>
            </div>
            <div className="relative">
              <HeroTutor />
            </div>
          </div>
        </section>

        {/* FAIXA */}
        <section aria-label="Destaques" className="border-y border-line bg-surface">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 text-center text-sm font-semibold md:grid-cols-4">
            <li><span className="block text-2xl font-extrabold text-brand">3</span>idiomas</li>
            <li><span className="block text-2xl font-extrabold text-brand">8</span>tutores com estilos diferentes</li>
            <li><span className="block text-2xl font-extrabold text-brand">A1 → C1</span>do zero ao avançado</li>
            <li><span className="block text-2xl font-extrabold text-brand">7 dias</span>de garantia</li>
          </ul>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Aprender falando, do primeiro minuto</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">Nada de decorar listas. Você conversa, o tutor ajusta o nível e o app guarda o que você precisa revisar.</p>
          </Reveal>
          <div className="mt-12 grid items-center gap-10 md:grid-cols-[1fr_auto_1fr]">
            <ol className="space-y-6">
              {PASSOS.map((p, i) => (
                <Reveal key={p.n} delay={i * 120}>
                  <li className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-extrabold text-brand-ink">{p.n}</span>
                    <div><h3 className="text-lg font-extrabold">{p.titulo}</h3><p className="mt-1 text-ink-soft">{p.texto}</p></div>
                  </li>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={150}>
              <PhoneFrame src="/site/app-aula.png" alt="Tela da aula ao vivo: a tutora Grace falando, com legenda, missões da conversa e botões Devagar, Traduzir e Dica" className="flutuar" />
            </Reveal>
            <Reveal delay={250} className="hidden md:block">
              <PhoneFrame src="/site/app-relatorio.png" alt="Relatório da aula com duração, missões cumpridas, palavras faladas e nota de pronúncia" className="flutuar [--r:3deg] [animation-delay:-2s]" />
            </Reveal>
          </div>
        </section>

        {/* RECURSOS */}
        <section className="bg-surface-2/60 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Tudo o que uma boa aula de conversação tem</h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">E o que ela não tem: disponível 24 horas, sem agendar e sem julgamento.</p>
            </Reveal>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {RECURSOS.map((r, i) => (
                <Reveal key={r.titulo} delay={(i % 3) * 100}>
                  <li className="card h-full p-6 transition hover:-translate-y-1 hover:shadow-lg">
                    <span className="text-3xl" aria-hidden>{r.icone}</span>
                    <h3 className="mt-3 text-lg font-extrabold">{r.titulo}</h3>
                    <p className="mt-1 text-ink-soft">{r.texto}</p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* TUTORES */}
        <section id="tutores" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Escolha quem vai conversar com você</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">Sotaques americano, britânico, mexicano, espanhol, paulista, carioca e mineiro. Calmo, animado, direto ou focado em carreira: tem um tutor do seu jeito.</p>
          </Reveal>
          <div className="mt-10"><TutoresSite /></div>
        </section>

        {/* OBJETIVOS + TELAS */}
        <section className="bg-brand py-20 text-brand-ink">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
            <div>
              <Reveal><h2 className="text-3xl font-extrabold sm:text-4xl">Aulas para o seu objetivo</h2></Reveal>
              <ul className="mt-8 space-y-4">
                {OBJETIVOS.map((o, i) => (
                  <Reveal key={o.t} delay={i * 80}>
                    <li className="flex gap-4 rounded-2xl bg-white/10 p-4">
                      <span className="text-2xl" aria-hidden>{o.e}</span>
                      <div><p className="font-extrabold">{o.t}</p><p className="opacity-90">{o.d}</p></div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
            <div className="flex justify-center gap-4">
              <Reveal><PhoneFrame src="/site/app-inicio.png" alt="Tela inicial do app com a aula do dia, meta diária e minutos do mês" className="flutuar" /></Reveal>
              <Reveal delay={200} className="hidden lg:block"><PhoneFrame src="/site/app-tutores.png" alt="Tela de escolha do tutor com o nível estimado do aluno" className="flutuar mt-16 [animation-delay:-3s]" /></Reveal>
            </div>
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Planos simples, sem surpresa</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">Comece pelo teste de nível grátis. Assine só se gostar, e ainda tem 7 dias para desistir com devolução integral.</p>
          </Reveal>
          <div className="mt-10"><PlanosSite /></div>
        </section>

        {/* FAQ */}
        <section id="perguntas" className="bg-surface-2/60 py-20">
          <div className="mx-auto max-w-3xl scroll-mt-20 px-4">
            <Reveal><h2 className="text-center text-3xl font-extrabold sm:text-4xl">Perguntas frequentes</h2></Reveal>
            <div className="mt-10 space-y-3">
              {FAQ.map((f) => (
                <details key={f.p} className="card group p-0">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold">
                    {f.p}<span className="text-brand transition group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="px-5 pb-5 text-ink-soft">{f.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Reveal>
            <h2 className="text-balance text-3xl font-extrabold sm:text-5xl">Seu próximo idioma começa com uma conversa.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">Descubra seu nível em 3 minutos e conheça seu tutor. Grátis, por voz, sem cartão.</p>
            <Link href="/comecar" className="btn-primary mt-8 px-8 text-lg">Fazer o teste de nível grátis</Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-extrabold text-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="" width={28} height={28} className="rounded-lg" /> Papalinguas
            </p>
            <p className="mt-2 text-ink-soft">Tutores de IA para você falar um novo idioma.</p>
          </div>
          <nav aria-label="Documentos legais" className="flex flex-col gap-2">
            <Link href="/legal/termos" className="hover:text-brand">Termos de Uso</Link>
            <Link href="/legal/privacidade" className="hover:text-brand">Política de Privacidade</Link>
            <Link href="/legal/cookies" className="hover:text-brand">Política de Cookies</Link>
            <Link href="/legal/reembolso" className="hover:text-brand">Reembolso e Cancelamento</Link>
          </nav>
          <div className="text-ink-soft">
            <p>{SITE.empresa}</p>
            <p>CNPJ {SITE.cnpj}</p>
            <p><a href={`mailto:${SITE.contato}`} className="hover:text-brand">{SITE.contato}</a></p>
            <p className="mt-2">© {new Date().getFullYear()} Papalinguas. Para maiores de 18 anos.</p>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </>
  );
}
