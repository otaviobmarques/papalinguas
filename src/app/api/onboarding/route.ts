import { NextResponse } from "next/server";
import { z } from "zod";
import { LANG_CODES } from "@/lib/domain/types";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";
import { lerSettings } from "@/lib/services/settings";

const Body = z.object({
  idioma: z.enum(LANG_CODES),
  objetivo: z.enum(["carreira", "viagem", "prova", "morar_fora", "conversar"]),
  interesses: z.array(z.string().max(40)).max(20),
  metaDiaria: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  uiLocale: z.enum(["pt-BR", "en", "es"]).default("pt-BR"),
  aceiteTermos: z.literal(true),
  maioridade: z.literal(true),
  consentimentoVoz: z.literal(true),
  marketing: z.boolean().default(false),
});

/** POST /api/onboarding — salva o cadastro inicial e os consentimentos versionados (O3, O4, O5). */
export async function POST(req: Request) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return erro(400, "requisicao_invalida", p.error.issues[0]?.message);

  const sb = supabaseAdmin();
  const versao = String((await lerSettings(sb)).termos_versao ?? "desconhecida");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const agora = new Date().toISOString();

  const { error: uErr } = await sb.from("users").upsert({
    id: user.id, email: user.email!, ui_locale: p.data.uiLocale, terms_version: versao, terms_accepted_at: agora, adult_confirmed: true,
  });
  if (uErr) throw uErr;

  const { error: pErr } = await sb.from("profiles").upsert({
    user_id: user.id, target_language: p.data.idioma, goal: p.data.objetivo, interests: p.data.interesses, daily_goal_minutes: p.data.metaDiaria,
  }, { onConflict: "user_id,target_language" });
  if (pErr) throw pErr;

  const consents = [
    { type: "termos", granted: true }, { type: "privacidade", granted: true }, { type: "voz", granted: true },
    { type: "maioridade", granted: true }, { type: "marketing", granted: p.data.marketing },
  ].map((c) => ({ ...c, user_id: user.id, version: versao, ip, source: "onboarding" }));
  const { error: cErr } = await sb.from("consents").insert(consents);
  if (cErr) throw cErr;

  return NextResponse.json({ ok: true });
}
