import { notFound } from "next/navigation";
import { TELAS_ADMIN } from "@/lib/admin/telas";

export default async function TelaAdmin({ params }: { params: Promise<{ tela: string }> }) {
  const { tela } = await params;
  const t = TELAS_ADMIN.find((x) => x.slug === tela);
  if (!t) notFound();
  return (
    <main>
      <h1 className="text-2xl font-extrabold">{t.codigo} · {t.nome}</h1>
      <p className="mt-2 text-ink-soft">Prevista para a sprint {t.sprint} (Manual Técnico, seção 18).</p>
    </main>
  );
}
