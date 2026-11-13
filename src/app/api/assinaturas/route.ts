import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";
import { asaasDoCofre } from "@/lib/providers/payments/asaasSetup";
import { cpfValido, normalizarCpf } from "@/lib/domain/cpf";
import { assinaturaVigente } from "@/lib/domain/cortesia";

const Body = z.object({
  plano: z.enum(["essencial", "fluente"]),
  periodo: z.enum(["mensal", "anual"]),
  metodo: z.enum(["pix", "pix_automatico", "cartao"]),
  nome: z.string().trim().min(3).max(120),
  cpf: z.string().refine(cpfValido, "CPF inválido"),
});

/**
 * POST /api/assinaturas (Manual 8.2): cria cliente e assinatura no Asaas e devolve o Pix
 * ou o link da página de cartão do gateway. O plano NÃO é liberado aqui: só pelo webhook.
 */
export async function POST(req: Request) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return erro(400, "requisicao_invalida", p.error.issues[0]?.message);

  const asaas = await asaasDoCofre();
  if (!asaas) return erro(503, "pagamentos_indisponiveis", "Pagamentos ainda não configurados.");

  const sb = supabaseAdmin();
  const cpf = normalizarCpf(p.data.cpf);

  const { data: u } = await sb.from("users").select("id, email, status").eq("id", user.id).maybeSingle();
  if (!u) return erro(409, "cadastro_incompleto", "Conclua o cadastro antes de assinar.");
  if (u.status !== "ativo") return erro(403, "conta_inativa");

  const { data: plano } = await sb.from("plans").select("id, name, period, price_brl_cents")
    .eq("code", p.data.plano).eq("period", p.data.periodo).eq("active", true)
    .order("price_version", { ascending: false }).limit(1).maybeSingle();
  if (!plano) return erro(404, "plano_inexistente");

  const { data: anteriores } = await sb.from("subscriptions")
    .select("id, status, external_id, external_customer_id, started_at").eq("user_id", user.id).eq("gateway", "asaas")
    .order("created_at", { ascending: false });
  if (anteriores?.some((s) => ["ativa", "em_garantia", "inadimplente"].includes(s.status))) {
    return erro(409, "ja_assinante", "Você já tem uma assinatura ativa.");
  }
  // Tentativa anterior não paga: cancela no gateway para não gerar cobrança duplicada
  for (const s of anteriores?.filter((x) => x.status === "pendente") ?? []) {
    if (s.external_id) await asaas.cancelarAssinatura(s.external_id).catch(() => {});
    await sb.from("subscriptions").update({ status: "cancelada", canceled_at: new Date().toISOString() }).eq("id", s.id);
  }

  await sb.from("users").update({ cpf, name: p.data.nome }).eq("id", user.id);
  const clienteId = anteriores?.find((s) => s.external_customer_id)?.external_customer_id
    ?? (await asaas.criarCliente({ nome: p.data.nome, email: u.email, cpf, referenciaExterna: user.id }));

  const { data: sub, error } = await sb.from("subscriptions").insert({
    user_id: user.id, plan_id: plano.id, gateway: "asaas", method: p.data.metodo, external_customer_id: clienteId,
    status: "pendente", is_first_subscription: !anteriores?.some((s) => s.started_at),
  }).select("id").single();
  if (error) throw error;

  try {
    const r = await asaas.criarAssinatura(
      clienteId,
      { descricao: `Papalinguas ${plano.name} ${plano.period}`, valorCentavos: plano.price_brl_cents, ciclo: plano.period as "mensal" | "anual" },
      p.data.metodo,
      sub.id,
    );
    await sb.from("subscriptions").update({ external_id: r.externalId }).eq("id", sub.id);
    return NextResponse.json({
      assinaturaId: sub.id,
      valorCentavos: plano.price_brl_cents,
      pix: r.primeiraCobranca?.pix ?? null,
      urlPagamento: r.primeiraCobranca?.urlPagamento ?? null,
    });
  } catch (e) {
    console.error("asaas criarAssinatura", e);
    await sb.from("subscriptions").update({ status: "cancelada", canceled_at: new Date().toISOString() }).eq("id", sub.id);
    return erro(502, "gateway_indisponivel", "Não conseguimos gerar a cobrança agora. Tente de novo em instantes.");
  }
}

/** GET /api/assinaturas — situação da assinatura mais recente (o app consulta enquanto espera o Pix). */
export async function GET() {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const { data } = await supabaseAdmin().from("subscriptions")
    .select("id, status, gateway, current_period_end, cancel_at_period_end, plans!subscriptions_plan_id_fkey(code, period, minutes_per_cycle)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (data && !assinaturaVigente(data)) return NextResponse.json({ assinatura: { ...data, status: "expirada" } });
  return NextResponse.json({ assinatura: data ?? null });
}
