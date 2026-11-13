import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { asaasDoCofre } from "@/lib/providers/payments/asaasSetup";
import { processarEventoPagamento } from "@/lib/services/billing";
import { erro, exigeBackend } from "@/lib/services/http";

/**
 * POST /api/webhooks/asaas — Manual 9.5:
 * valida o token, grava em webhook_events antes de processar, idempotente por (provider, event_id).
 */
export async function POST(req: Request) {
  const demo = exigeBackend();
  if (demo) return demo;
  const asaas = await asaasDoCofre();
  if (!asaas) return erro(503, "asaas_nao_configurado");
  const raw = await req.text();
  if (!asaas.validarWebhook(req.headers, raw)) return erro(401, "token_invalido");

  let evento;
  try {
    evento = asaas.traduzirEvento(JSON.parse(raw));
  } catch {
    return erro(400, "corpo_invalido");
  }

  const sb = supabaseAdmin();
  const { data: novo, error } = await sb.from("webhook_events")
    .upsert({ provider: "asaas", event_id: evento.eventId, event_type: evento.tipoOriginal, body: JSON.parse(raw) },
      { onConflict: "provider,event_id", ignoreDuplicates: true })
    .select("id").maybeSingle();
  if (error) throw error;
  if (!novo) return NextResponse.json({ ok: true, duplicado: true });

  try {
    await processarEventoPagamento(sb, "asaas", evento);
    await sb.from("webhook_events").update({ processed_at: new Date().toISOString(), attempts: 1 }).eq("id", novo.id);
  } catch (e) {
    // Fica pendente para o reprocessamento automático (cron); respondemos 200 para o Asaas não pausar a fila.
    await sb.from("webhook_events").update({ attempts: 1, last_error: String(e).slice(0, 500) }).eq("id", novo.id);
    console.error("webhook asaas", e);
  }
  return NextResponse.json({ ok: true });
}
