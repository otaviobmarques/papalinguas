import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";

/** POST /api/aulas/:id/encerrar — fecha a aula; aula com menos de 1 min não gera relatório. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const { id } = await params;
  const motivo = String(((await req.json().catch(() => ({}))) as { motivo?: string }).motivo ?? "aluno").slice(0, 40);
  const sb = supabaseAdmin();

  const { data: aula } = await sb.from("lessons")
    .update({ status: "encerrada", ended_at: new Date().toISOString(), end_reason: motivo })
    .eq("id", id).eq("user_id", user.id).in("status", ["abrindo", "ao_vivo"])
    .select("id, seconds_billed").maybeSingle();
  if (!aula) return erro(404, "aula_inexistente");

  const gera = aula.seconds_billed >= 60;
  await sb.from("reports").insert({ lesson_id: id, user_id: user.id, status: gera ? "gerando" : "sem_relatorio" });
  // TODO(sprint 3): enfileirar geração do relatório (pgmq) e cartões de revisão
  return NextResponse.json({ relatorio: gera ? "gerando" : "sem_relatorio" });
}
