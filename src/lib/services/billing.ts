import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventoTraduzido, GatewayCode } from "@/lib/providers/payments/types";

const DIA = 86_400_000;

/**
 * Processa um evento de pagamento já validado e gravado em webhook_events.
 * Regra de ouro (Manual 8.2): o plano só é liberado aqui, nunca pela resposta do navegador.
 */
export async function processarEventoPagamento(sb: SupabaseClient, gateway: GatewayCode, e: EventoTraduzido) {
  if (e.evento === "ignorado") return;

  const { data: sub } = e.assinaturaExternalId
    ? await sb
        .from("subscriptions")
        .select("id, user_id, plan_id, status, is_first_subscription, started_at, plans(minutes_per_cycle, period)")
        .eq("gateway", gateway)
        .eq("external_id", e.assinaturaExternalId)
        .maybeSingle()
    : { data: null };

  switch (e.evento) {
    case "pagamento_confirmado": {
      if (!e.pagamentoExternalId) throw new Error("pagamento sem id");
      const agora = new Date();
      const { data: pay, error } = await sb
        .from("payments")
        .upsert(
          {
            user_id: sub?.user_id ?? null,
            subscription_id: sub?.id ?? null,
            plan_id: sub?.plan_id ?? null,
            gateway,
            external_id: e.pagamentoExternalId,
            method: e.metodo ?? "pix",
            status: "confirmado",
            amount_cents: e.valorCentavos ?? 0,
            fee_cents: e.taxaCentavos ?? null,
            net_cents: e.liquidoCentavos ?? null,
            paid_at: agora.toISOString(),
          },
          { onConflict: "gateway,external_id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      if (!sub) return; // pacote extra ou cobrança avulsa: tratado na sprint 4

      const plano = sub.plans as unknown as { minutes_per_cycle: number; period: "mensal" | "anual" };
      const inicio = agora;
      const fim = new Date(inicio);
      if (plano.period === "anual") fim.setUTCFullYear(fim.getUTCFullYear() + 1);
      else fim.setUTCMonth(fim.getUTCMonth() + 1);

      const primeira = sub.is_first_subscription && !sub.started_at;
      await sb
        .from("subscriptions")
        .update({
          status: primeira ? "em_garantia" : "ativa",
          started_at: sub.started_at ?? inicio.toISOString(),
          current_period_start: inicio.toISOString(),
          current_period_end: fim.toISOString(),
          past_due_since: null,
        })
        .eq("id", sub.id);

      // Cota do ciclo: anual também renova minutos mensalmente (job mensal na sprint 4)
      const fimCota = plano.period === "anual" ? new Date(inicio.getTime() + 30 * DIA) : fim;
      await sb.from("usage_counters").upsert(
        {
          user_id: sub.user_id,
          subscription_id: sub.id,
          cycle_start: inicio.toISOString(),
          cycle_end: fimCota.toISOString(),
          cycle_seconds_quota: plano.minutes_per_cycle * 60,
        },
        { onConflict: "subscription_id,cycle_start", ignoreDuplicates: true },
      );
      void pay; // TODO(sprint 4): agendar NFS-e e e-mail de boas-vindas na fila
      return;
    }
    case "pagamento_falhou":
      if (sub && sub.status !== "inadimplente") {
        await sb.from("subscriptions").update({ status: "inadimplente", past_due_since: new Date().toISOString() }).eq("id", sub.id);
      }
      return;
    case "assinatura_cancelada":
      if (sub) await sb.from("subscriptions").update({ status: "cancelada", canceled_at: new Date().toISOString() }).eq("id", sub.id);
      return;
    case "reembolso_concluido":
      if (e.pagamentoExternalId) {
        await sb.from("payments").update({ status: "reembolsado" }).eq("gateway", gateway).eq("external_id", e.pagamentoExternalId);
      }
      return;
    case "contestacao_aberta": {
      // Contestação suspende a assinatura e abre caso no admin (Manual 9.6)
      if (!e.pagamentoExternalId) return;
      const { data: p } = await sb.from("payments").update({ status: "contestado" })
        .eq("gateway", gateway).eq("external_id", e.pagamentoExternalId).select("id").maybeSingle();
      if (p) await sb.from("disputes").insert({ payment_id: p.id, external_id: e.eventId, respond_by: new Date(Date.now() + 7 * DIA).toISOString() });
      if (sub) await sb.from("subscriptions").update({ status: "inadimplente", past_due_since: new Date().toISOString() }).eq("id", sub.id);
      return;
    }
    case "nota_emitida":
      return; // TODO(sprint 4): atualizar invoices
  }
}
