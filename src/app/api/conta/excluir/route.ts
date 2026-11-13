import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";

/**
 * POST /api/conta/excluir (Manual 8.6, LGPD): registra o pedido do titular e coloca a conta
 * "em exclusão" por 30 dias (reversível pelo suporte). A anonimização após o prazo e o
 * cancelamento no gateway são feitos pela rotina de exclusão (P17) — ainda manual no MVP.
 */
export async function POST() {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const sb = supabaseAdmin();
  const agora = new Date();
  const { error } = await sb.from("users").update({ status: "em_exclusao", deletion_requested_at: agora.toISOString() }).eq("id", user.id);
  if (error) throw error;
  await sb.from("privacy_requests").insert({ user_id: user.id, kind: "exclusao", due_at: new Date(agora.getTime() + 15 * 86_400_000).toISOString() });
  // Assinatura cortesia termina na hora; assinaturas pagas são canceladas pela equipe no gateway (sem nova cobrança após o pedido)
  await sb.from("subscriptions").update({ status: "cancelada", canceled_at: agora.toISOString(), cancel_at_period_end: true })
    .eq("user_id", user.id).eq("gateway", "cortesia").eq("status", "ativa");
  const exclusao = new Date(agora.getTime() + 30 * 86_400_000);
  return NextResponse.json({ ok: true, excluidaEm: exclusao.toISOString() });
}
