import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";
import { lerSettings, num } from "@/lib/services/settings";
import { avaliarInicioDeAula, MENSAGENS_BLOQUEIO } from "@/lib/domain/quota";
import { assinaturaVigente } from "@/lib/domain/cortesia";
import { montarInstrucoes } from "@/lib/domain/tutorPrompt";
import { openAIVoice } from "@/lib/providers/voice";
import { azurePronunciation } from "@/lib/providers/pronunciation";
import type { KillSwitchMode, LangCode } from "@/lib/domain/types";

const Body = z.object({
  idioma: z.enum(["en", "es", "pt"]),
  cenarioId: z.string().uuid().optional(),
  cenarioSlug: z.string().max(80).optional(),
  modo: z.enum(["aula", "livre"]).default("aula"),
});

/** POST /api/aulas — Manual 3.2 e 8.1 */
export async function POST(req: Request) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return erro(400, "requisicao_invalida");
  const { idioma, cenarioId, cenarioSlug, modo } = parsed.data;

  const sb = supabaseAdmin();
  const settings = await lerSettings(sb);
  const agora = new Date();
  const inicioDia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));

  const [u, sub, counter, packs, hoje, aulasHoje, profile] = await Promise.all([
    sb.from("users").select("status, suspended_until").eq("id", user.id).single(),
    sb.from("subscriptions").select("id, status, past_due_since, cancel_at_period_end, current_period_end, plans(code, daily_limit_minutes)")
      .eq("user_id", user.id).in("status", ["ativa", "em_garantia", "inadimplente"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("usage_counters").select("cycle_seconds_quota, cycle_seconds_used, bonus_seconds")
      .eq("user_id", user.id).lte("cycle_start", agora.toISOString()).gt("cycle_end", agora.toISOString())
      .order("cycle_end", { ascending: false }).limit(1).maybeSingle(),
    sb.from("extra_packs").select("seconds_total, seconds_used").eq("user_id", user.id).gt("expires_at", agora.toISOString()),
    sb.from("progress_daily").select("seconds_spoken").eq("user_id", user.id).eq("day", inicioDia.toISOString().slice(0, 10)).maybeSingle(),
    sb.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("started_at", inicioDia.toISOString()).neq("kind", "nivelamento"),
    sb.from("profiles").select("level, tutor_id, acolher").eq("user_id", user.id).eq("target_language", idioma).maybeSingle(),
  ]);
  if (u.error || !u.data) return erro(404, "usuario_nao_encontrado");

  const plano = sub.data?.plans as unknown as { code: string; daily_limit_minutes: number } | undefined;
  const c = counter.data;
  const gate = avaliarInicioDeAula({
    agora,
    usuario: { status: u.data.status, suspensoAte: u.data.suspended_until ? new Date(u.data.suspended_until) : null },
    assinatura: sub.data && assinaturaVigente(sub.data, agora) ? { status: sub.data.status, inadimplenteDesde: sub.data.past_due_since ? new Date(sub.data.past_due_since) : null } : null,
    cota: {
      cicloRestanteSeg: c ? Math.max(0, c.cycle_seconds_quota + c.bonus_seconds - c.cycle_seconds_used) : 0,
      extraRestanteSeg: (packs.data ?? []).reduce((s, p) => s + (p.seconds_total - p.seconds_used), 0),
    },
    hoje: { segundosFalados: hoje.data?.seconds_spoken ?? 0, aulas: aulasHoje.count ?? 0 },
    limites: {
      limiteDiarioMin: plano?.daily_limit_minutes ?? 30,
      aulasPorDiaMax: num(settings.aulas_por_dia_max, 10),
      duracaoMaxAulaMin: num(settings.aula_duracao_max_min, 20),
      toleranciaInadimplenciaDias: num(settings.tolerancia_inadimplencia_dias, 3),
    },
    killSwitch: ((settings.kill_switch as { modo?: KillSwitchMode })?.modo ?? "desligado"),
  });
  if (!gate.ok) return NextResponse.json({ erro: gate.motivo, mensagem: MENSAGENS_BLOQUEIO[gate.motivo] }, { status: 403 });

  // Tutor, cenário e memória
  const tutorQ = sb.from("tutors").select("id, name, openai_voice, base_prompt, language").eq("active", true).eq("language", idioma);
  const { data: tutor } = profile.data?.tutor_id
    ? await tutorQ.eq("id", profile.data.tutor_id).maybeSingle()
    : await tutorQ.limit(1).maybeSingle();
  if (!tutor) return erro(409, "sem_tutor");

  const camposCenario = "id, title, situation, missions, vocabulary, tutor_script, fluente_only";
  const { data: cenario } = cenarioId
    ? await sb.from("scenarios").select(camposCenario).eq("id", cenarioId).eq("status", "publicado").maybeSingle()
    : cenarioSlug
      ? await sb.from("scenarios").select(camposCenario).eq("slug", cenarioSlug).eq("status", "publicado").maybeSingle()
      : { data: null };
  if ((cenarioId || cenarioSlug) && !cenario) return erro(404, "cenario_nao_encontrado");
  if (cenario?.fluente_only && plano?.code !== "fluente") return erro(403, "requer_fluente");

  const { data: memoria } = await sb.from("memory_facts").select("fact").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);

  const instructions = montarInstrucoes({
    tutorNome: tutor.name,
    tutorPromptBase: tutor.base_prompt,
    idioma: idioma as LangCode,
    nivel: profile.data?.level ?? null,
    cenario: cenario
      ? {
          titulo: cenario.title,
          situacao: cenario.situation,
          missoes: cenario.missions as string[],
          vocabulario: (cenario.vocabulary as { termo: string }[]).map((v) => v.termo),
          roteiro: cenario.tutor_script,
        }
      : null,
    memoria: (memoria ?? []).map((m) => m.fact),
    acolher: (profile.data?.acolher as { ativo: boolean }) ?? { ativo: false },
    modo,
    correcoesPorFala: num(settings.correcoes_por_fala, 1),
  });

  const killMode = (settings.kill_switch as { modo?: string })?.modo;
  const modelo = killMode === "modelo_barato" ? "gpt-realtime-2.1-mini" : String(settings.modelo_voz_padrao ?? "gpt-realtime-2.1-mini");

  const { data: lesson, error: lErr } = await sb.from("lessons").insert({
    user_id: user.id, tutor_id: tutor.id, scenario_id: cenario?.id ?? null, language: idioma,
    kind: cenario ? "aula" : "livre", status: "abrindo", voice_provider: "openai", voice_model: modelo, pronunciation_provider: "azure",
  }).select("id").single();
  if (lErr) throw lErr;

  try {
    const [voz, pronuncia] = await Promise.all([
      openAIVoice.createEphemeralSession({ instructions, voice: tutor.openai_voice, model: modelo, maxSeconds: gate.segundosPermitidos }),
      azurePronunciation.issueToken(idioma as LangCode),
    ]);
    return NextResponse.json({
      aulaId: lesson.id,
      segundosPermitidos: gate.segundosPermitidos,
      avisoCotaBaixa: gate.avisoCotaBaixa,
      tutor: { id: tutor.id, nome: tutor.name },
      voz,
      pronuncia,
    });
  } catch (e) {
    await sb.from("lessons").update({ status: "falhou", end_reason: "credenciais", ended_at: new Date().toISOString() }).eq("id", lesson.id);
    console.error(e);
    return erro(502, "fornecedor_indisponivel", "Não conseguimos abrir a aula agora. Tente de novo em instantes.");
  }
}
