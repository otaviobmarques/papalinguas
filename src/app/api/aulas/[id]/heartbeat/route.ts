import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";
import { decidirHeartbeat } from "@/lib/domain/quota";
import { lerSettings, num } from "@/lib/services/settings";

const INTERVALO = 30;

/** POST /api/aulas/:id/heartbeat — a cada 30 s soma minutos; se a cota acabou, responde "encerrar". */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const { id } = await params;
  const sb = supabaseAdmin();

  const { data: aula } = await sb.from("lessons").select("id, user_id, status, started_at, last_heartbeat_at, live_at")
    .eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!aula || !["abrindo", "ao_vivo"].includes(aula.status)) return erro(404, "aula_inexistente");

  // Cobra só o tempo realmente decorrido desde o último heartbeat (máx. 30 s): sem cobrar desconexão
  const desde = new Date(aula.last_heartbeat_at ?? aula.live_at ?? aula.started_at).getTime();
  const decorrido = Math.min(INTERVALO, Math.max(0, Math.round((Date.now() - desde) / 1000)));
  if (aula.status === "abrindo") await sb.from("lessons").update({ status: "ao_vivo", live_at: new Date().toISOString() }).eq("id", id);
  if (decorrido < 5) return NextResponse.json({ acao: "continuar" });

  const { data, error } = await sb.rpc("consume_lesson_seconds", { p_lesson_id: id, p_seconds: decorrido });
  if (error) throw error;
  const r = (data as { cycle_left: number; extra_left: number }[])[0];
  const settings = await lerSettings(sb);
  const restante = r.cycle_left + r.extra_left;
  return NextResponse.json({ acao: decidirHeartbeat(restante, num(settings.aviso_cota_min, 2)), restanteSeg: restante });
}
