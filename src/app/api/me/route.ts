import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";
import { lerSettings, num } from "@/lib/services/settings";
import { assinaturaVigente } from "@/lib/domain/cortesia";
import { diaLocal, minutos, minutosPorSemana, sequenciaDias } from "@/lib/domain/progresso";

/** GET /api/me — tudo o que as telas do aluno mostram (A1, A2, A7, A8, A9). */
export async function GET() {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const sb = supabaseAdmin();
  const agora = new Date();
  const hoje = diaLocal(agora);
  const ha35 = new Date(agora.getTime() - 35 * 86_400_000).toISOString().slice(0, 10);

  const [u, perfis, subs, counter, packs, prog, aulas, ultima, cartoes, conquistas, settings] = await Promise.all([
    sb.from("users").select("name, email, status, ui_locale").eq("id", user.id).maybeSingle(),
    sb.from("profiles").select("target_language, is_primary, level, level_confidence, level_tested_at, goal, interests, daily_goal_minutes, tutor_id, tutors(slug, name)").eq("user_id", user.id),
    sb.from("subscriptions").select("id, status, gateway, method, current_period_end, cancel_at_period_end, is_first_subscription, started_at, plans!subscriptions_plan_id_fkey(code, name, period, minutes_per_cycle, daily_limit_minutes, price_brl_cents)")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    sb.from("usage_counters").select("cycle_seconds_quota, cycle_seconds_used, bonus_seconds, cycle_end")
      .eq("user_id", user.id).lte("cycle_start", agora.toISOString()).gt("cycle_end", agora.toISOString()).order("cycle_end", { ascending: false }).limit(1),
    sb.from("extra_packs").select("seconds_total, seconds_used, expires_at").eq("user_id", user.id).gt("expires_at", agora.toISOString()),
    sb.from("progress_daily").select("day, seconds_spoken").eq("user_id", user.id).gte("day", ha35),
    sb.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("kind", "nivelamento").eq("status", "encerrada"),
    sb.from("lessons").select("id, kind, ended_at, scenarios(slug, title)").eq("user_id", user.id).neq("kind", "nivelamento").order("started_at", { ascending: false }).limit(1),
    sb.from("review_items").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("suspended", false).lte("next_review_at", agora.toISOString()),
    sb.from("user_achievements").select("earned_at, achievements(code, title)").eq("user_id", user.id),
    lerSettings(sb),
  ]);
  if (!u.data) return erro(409, "cadastro_incompleto");

  type Perfil = { target_language: string; is_primary: boolean; level: string | null; level_confidence: number | null; level_tested_at: string | null;
    goal: string | null; interests: string[]; daily_goal_minutes: number; tutors: { slug: string; name: string } | null };
  const lista = (perfis.data ?? []) as unknown as Perfil[];
  const perfil = lista.find((p) => p.is_primary) ?? lista[0] ?? null;

  type Sub = { id: string; status: string; gateway: string; method: string | null; current_period_end: string | null; cancel_at_period_end: boolean;
    is_first_subscription: boolean; started_at: string | null; plans: { code: string; name: string; period: string | null; minutes_per_cycle: number; daily_limit_minutes: number | null; price_brl_cents: number } | null };
  const subBruta = ((subs.data ?? []) as unknown as Sub[])[0] ?? null;
  const sub = subBruta ? { ...subBruta, status: assinaturaVigente(subBruta, agora) ? subBruta.status : "expirada" } : null;
  const ativa = !!sub && ["ativa", "em_garantia", "inadimplente"].includes(sub.status);

  const c = counter.data?.[0];
  const extraSeg = (packs.data ?? []).reduce((s, p) => s + (p.seconds_total - p.seconds_used), 0);
  const dias = (prog.data ?? []).filter((p) => p.seconds_spoken > 0);
  const segundosHoje = dias.find((d) => d.day === hoje)?.seconds_spoken ?? 0;
  const garantiaDias = num(settings.garantia_dias, 7);
  const emGarantia = !!sub && sub.is_first_subscription && !!sub.started_at
    && agora.getTime() - new Date(sub.started_at).getTime() < garantiaDias * 86_400_000 && sub.gateway !== "cortesia";
  const ult = (ultima.data?.[0] as unknown as { kind: string; scenarios: { slug: string; title: string } | null } | undefined) ?? null;

  return NextResponse.json({
    nome: u.data.name ?? user.email?.split("@")[0] ?? "",
    email: u.data.email,
    perfil: perfil && {
      idioma: perfil.target_language, nivel: perfil.level, confiancaNivel: perfil.level_confidence, nivelTestadoEm: perfil.level_tested_at,
      objetivo: perfil.goal, interesses: perfil.interests ?? [], metaDiariaMin: perfil.daily_goal_minutes,
      tutorSlug: perfil.tutors?.slug ?? null,
    },
    idiomas: lista.map((p) => p.target_language),
    assinatura: sub && {
      status: sub.status, ativa, gateway: sub.gateway, metodo: sub.method, renovaEm: sub.current_period_end, cancelaNoFim: sub.cancel_at_period_end,
      emGarantia, plano: sub.plans && { codigo: sub.plans.code, nome: sub.plans.name, periodo: sub.plans.period, precoCentavos: sub.plans.price_brl_cents },
    },
    cota: {
      totalMin: c ? minutos(c.cycle_seconds_quota + c.bonus_seconds) : 0,
      usadosMin: c ? minutos(c.cycle_seconds_used) : 0,
      restanteSeg: (c ? Math.max(0, c.cycle_seconds_quota + c.bonus_seconds - c.cycle_seconds_used) : 0) + extraSeg,
      extraMin: minutos(extraSeg),
      renovaEm: c?.cycle_end ?? null,
      limiteDiarioMin: sub?.plans?.daily_limit_minutes ?? 0,
    },
    hoje: { minutos: minutos(segundosHoje) },
    sequenciaDias: sequenciaDias(dias.map((d) => d.day), hoje),
    minutosPorSemana: minutosPorSemana(dias.map((d) => ({ dia: d.day, segundos: d.seconds_spoken })), hoje),
    aulasConcluidas: aulas.count ?? 0,
    ultimaAula: ult ? { cenarioSlug: ult.scenarios?.slug ?? null, titulo: ult.scenarios?.title ?? (ult.kind === "livre" ? "Modo livre" : "Aula") } : null,
    cartoesHoje: cartoes.count ?? 0,
    conquistas: (conquistas.data ?? []).map((x) => (x as unknown as { achievements: { code: string } | null }).achievements?.code).filter(Boolean),
  });
}
