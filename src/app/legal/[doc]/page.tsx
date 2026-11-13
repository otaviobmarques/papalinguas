import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { DOCUMENTOS } from "@/lib/legal/documentos";

export function generateStaticParams() {
  return Object.keys(DOCUMENTOS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const d = DOCUMENTOS[(await params).doc];
  return d ? { title: d.titulo, description: d.resumo, alternates: { canonical: `/legal/${(await params).doc}` } } : {};
}

export default async function Legal({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = DOCUMENTOS[doc];
  if (!d) notFound();
  return (
    <div className="tema-escuro min-h-dvh">
    <SiteHeader ancoras={false} />
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{d.titulo}</h1>
      <p className="mt-2 text-ink-soft">{d.resumo}</p>
      <p role="note" className="mt-6 rounded-2xl bg-warn-soft p-4 text-sm font-semibold text-warn">
        {d.versao}. Documento em revisão jurídica: o texto pode mudar antes da versão final.
      </p>
      <nav aria-label="Outros documentos" className="mt-6 flex flex-wrap gap-2">
        {Object.entries(DOCUMENTOS).map(([k, v]) => (
          <Link key={k} href={`/legal/${k}`} aria-current={k === doc ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink-soft hover:text-ink aria-[current=page]:border-brand aria-[current=page]:text-ink">{v.titulo}</Link>
        ))}
      </nav>
      <article className="mt-8 space-y-8">
        {d.secoes.map((s) => (
          <section key={s.titulo}>
            <h2 className="text-xl font-extrabold">{s.titulo}</h2>
            {s.paragrafos.map((p, i) => <p key={i} className="mt-3 leading-relaxed text-ink-soft">{p}</p>)}
          </section>
        ))}
      </article>
    </main>
    <SiteFooter />
    </div>
  );
}
