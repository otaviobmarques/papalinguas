import { redirect } from "next/navigation";
import { sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { cofre } from "@/lib/keys/store";
import ChaveCard from "./ChaveCard";

export const dynamic = "force-dynamic";

/** P18.1 · Chaves de integração (só Super Admin; valores mascarados; toda alteração na auditoria). */
export default async function Chaves() {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "gerir_chaves")) redirect("/admin");

  let registros: Awaited<ReturnType<ReturnType<typeof cofre>["listar"]>> = [];
  let erroCofre: string | null = null;
  try {
    registros = await cofre().listar();
  } catch (e) {
    erroCofre = e instanceof Error ? e.message : "Cofre indisponível";
  }
  const sem = !process.env.KEYS_ENCRYPTION_KEY;
  const ver = (provider: string, slot: string) => {
    const r = registros.find((x) => x.provider === provider && x.slot === slot);
    if (!r) return null;
    const prefixo = provider === "openai" ? "sk-proj-" : "sk-ant-";
    return { mascara: `${prefixo}…${r.last4}`, status: r.status, validadaEm: r.validated_at, atualizadaEm: r.updated_at };
  };

  return (
    <main className="max-w-3xl">
      <h1 className="text-2xl font-extrabold">Chaves de integração</h1>
      <p className="mt-1 text-ink-soft">A chave principal da OpenAI move a conversa por voz e os relatórios. Se a OpenAI falhar, os textos (relatórios, memória) passam a usar a chave backup da Anthropic.</p>
      {sem && <p role="alert" className="mt-4 rounded-2xl bg-accent-soft p-3 text-sm font-semibold text-danger">KEYS_ENCRYPTION_KEY não está configurada no servidor: não é possível salvar chaves.</p>}
      {erroCofre && <p role="alert" className="mt-4 rounded-2xl bg-accent-soft p-3 text-sm font-semibold text-danger">{erroCofre}</p>}
      <div className="mt-6 flex flex-col gap-4">
        <ChaveCard provider="openai" titulo="OpenAI · principal" descricao="Voz em tempo real (Realtime) e modelo de texto." placeholder="sk-proj-…" atual={ver("openai", "principal")} />
        <ChaveCard provider="anthropic" titulo="Anthropic · backup" descricao="Plano B para textos: relatório pós-aula, memória do aluno e geração de conteúdo." placeholder="sk-ant-…" atual={ver("anthropic", "backup")} />
      </div>
    </main>
  );
}
