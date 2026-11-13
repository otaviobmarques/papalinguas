import Link from "next/link";
import { notFound } from "next/navigation";

const DOCS: Record<string, string> = { termos: "Termos de Uso", privacidade: "Política de Privacidade", reembolso: "Política de Reembolso e Cancelamento", cookies: "Política de Cookies" };

export default async function Legal({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const titulo = DOCS[doc];
  if (!titulo) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-ink-soft underline">← Voltar</Link>
      <h1 className="mt-4 text-3xl font-extrabold">{titulo}</h1>
      <p className="mt-4 rounded-2xl bg-warn-soft p-4 text-sm text-warn">
        Texto em preparação. Será publicado após a revisão jurídica (Manual Técnico, seção 14) e antes do lançamento.
      </p>
    </main>
  );
}
