import { NextResponse } from "next/server";
import { z } from "zod";
import { LANG_CODES, type LangCode } from "@/lib/domain/types";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";
import { gerarTexto } from "@/lib/providers/text";
import { estimarPorRegra, lerAvaliacao, pedidoAvaliacao, resultadoPulado, SISTEMA_AVALIADOR, type ResultadoNivel } from "@/lib/domain/nivel";

const Body = z.union([
  z.object({ pular: z.literal(true), idioma: z.enum(LANG_CODES) }),
  z.object({
    aulaId: z.string().uuid(),
    dispositivo: z.string().min(8).max(100),
    falas: z.array(z.object({ quem: z.enum(["aluno", "tutor"]), texto: z.string().max(2000) })).max(200),
  }),
]);

/** POST /api/nivel/concluir — avalia a conversa (IA com plano B) e grava o nível no perfil. */
export async function POST(req: Request) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return erro(400, "requisicao_invalida");
  const sb = supabaseAdmin();

  let idioma: LangCode;
  let resultado: ResultadoNivel;

  if ("pular" in p.data) {
    // "Não sei falar nada ainda": começa no A1 sem gastar o teste gratuito
    idioma = p.data.idioma;
    resultado = resultadoPulado();
  } else {
    const { aulaId, falas } = p.data;
    const { data: aula } = await sb.from("lessons").select("id, language, kind, status, started_at")
      .eq("id", aulaId).eq("user_id", user.id).eq("kind", "nivelamento").maybeSingle();
    if (!aula) return erro(404, "teste_inexistente");
    idioma = aula.language;
    const segundos = Math.min(600, Math.round((Date.now() - new Date(aula.started_at).getTime()) / 1000));
    if (["abrindo", "ao_vivo"].includes(aula.status)) {
      await sb.from("lessons").update({ status: "encerrada", ended_at: new Date().toISOString(), end_reason: "nivelamento", seconds_billed: segundos }).eq("id", aulaId);
      if (falas.length) {
        await sb.from("lesson_events").insert(falas.slice(0, 200).map((f) => ({ lesson_id: aulaId, user_id: user.id, speaker: f.quem, text: f.texto })));
      }
    }

    const temFala = falas.some((f) => f.quem === "aluno" && f.texto.trim().length > 1);
    let avaliado = null;
    if (temFala) {
      try {
        const r = await gerarTexto({ sistema: SISTEMA_AVALIADOR, usuario: pedidoAvaliacao(idioma, falas), maxTokens: 2000 });
        avaliado = lerAvaliacao(r.texto);
      } catch (e) {
        console.error("avaliação de nível", e);
      }
    }
    resultado = avaliado ? { ...avaliado, fonte: "ia" } : temFala ? { ...estimarPorRegra(falas), fonte: "regra" } : resultadoPulado();
  }

  await sb.from("profiles").upsert({
    user_id: user.id, target_language: idioma, level: resultado.nivel, level_confidence: resultado.confianca,
    ...(resultado.fonte === "pulado" ? {} : { level_tested_at: new Date().toISOString() }),
  }, { onConflict: "user_id,target_language" });

  return NextResponse.json(resultado);
}
