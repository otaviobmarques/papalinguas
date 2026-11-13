import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";
import { lerSettings, num } from "@/lib/services/settings";
import { jaUsou, marcarUso } from "@/lib/services/antiabuso";
import { montarInstrucoes } from "@/lib/domain/tutorPrompt";
import { openAIVoice } from "@/lib/providers/voice";
import type { LangCode } from "@/lib/domain/types";

const Body = z.object({ idioma: z.enum(["en", "es", "pt"]), dispositivo: z.string().min(8).max(100) });
const DIA = 86_400_000;

/**
 * POST /api/nivel/iniciar (Manual M02, Telas O6): conversa de até 3 min, antes do pagamento,
 * uma vez por pessoa (e-mail e dispositivo). Assinante pode refazer a cada 30 dias.
 */
export async function POST(req: Request) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return erro(400, "requisicao_invalida");
  const { idioma, dispositivo } = p.data;

  const sb = supabaseAdmin();
  const settings = await lerSettings(sb);
  const minutos = num(settings.nivelamento_minutos, 3);
  if (settings.nivelamento_ativo === false || minutos <= 0) return erro(403, "nivelamento_desligado", "O teste de nível está desligado no momento.");

  const [{ data: u }, { data: sub }, { data: perfil }] = await Promise.all([
    sb.from("users").select("status").eq("id", user.id).maybeSingle(),
    sb.from("subscriptions").select("id").eq("user_id", user.id).in("status", ["ativa", "em_garantia"]).limit(1).maybeSingle(),
    sb.from("profiles").select("level, level_tested_at").eq("user_id", user.id).eq("target_language", idioma).maybeSingle(),
  ]);
  if (!u) return erro(409, "cadastro_incompleto", "Conclua o cadastro antes do teste.");
  if (u.status !== "ativo") return erro(403, "conta_inativa");

  if (sub) {
    const ultimo = perfil?.level_tested_at ? new Date(perfil.level_tested_at).getTime() : 0;
    if (Date.now() - ultimo < 30 * DIA) return erro(409, "nivelamento_recente", "Você pode refazer o teste de nível a cada 30 dias.");
  } else if (await jaUsou(sb, "nivelamento", [{ tipo: "email", valor: user.email }, { tipo: "device", valor: dispositivo }])) {
    return NextResponse.json({ erro: "nivelamento_usado", mensagem: "O teste de nível gratuito já foi feito nesta conta ou neste aparelho.", nivel: perfil?.level ?? null }, { status: 409 });
  }

  const { data: tutor } = await sb.from("tutors").select("id, name, openai_voice, base_prompt").eq("active", true).eq("language", idioma).limit(1).maybeSingle();
  if (!tutor) return erro(409, "sem_tutor");

  const instructions = montarInstrucoes({
    tutorNome: tutor.name, tutorPromptBase: tutor.base_prompt, idioma: idioma as LangCode, nivel: null, cenario: null,
    memoria: [], acolher: { ativo: false }, modo: "nivelamento", correcoesPorFala: 0,
  });

  const { data: aula, error } = await sb.from("lessons").insert({
    user_id: user.id, tutor_id: tutor.id, language: idioma, kind: "nivelamento", status: "abrindo",
    voice_provider: "openai", voice_model: "gpt-realtime-2.1-mini",
  }).select("id").single();
  if (error) throw error;
  // Conta como usado ao abrir (fechar a aba ou pular no meio não devolve o teste gratuito)
  if (!sub) await marcarUso(sb, "nivelamento", user.id, [{ tipo: "email", valor: user.email }, { tipo: "device", valor: dispositivo }]);

  try {
    const voz = await openAIVoice.createEphemeralSession({ instructions, voice: tutor.openai_voice, model: "gpt-realtime-2.1-mini", maxSeconds: minutos * 60 });
    return NextResponse.json({ aulaId: aula.id, segundosPermitidos: minutos * 60, tutor: { nome: tutor.name }, voz });
  } catch (e) {
    console.error(e);
    await sb.from("lessons").update({ status: "falhou", end_reason: "credenciais", ended_at: new Date().toISOString() }).eq("id", aula.id);
    return erro(502, "fornecedor_indisponivel", "Não conseguimos abrir o teste agora. Tente de novo em instantes.");
  }
}
