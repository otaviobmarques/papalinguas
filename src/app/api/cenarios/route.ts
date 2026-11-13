import { NextResponse } from "next/server";
import { z } from "zod";
import { LANG_CODES } from "@/lib/domain/types";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { erro } from "@/lib/services/http";

/** GET /api/cenarios?idioma= — cenários publicados com a unidade (Manual 7). Conteúdo público do catálogo. */
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return erro(503, "modo_demo");
  const idioma = z.enum(LANG_CODES).safeParse(new URL(req.url).searchParams.get("idioma"));
  const consulta = supabaseAdmin().from("scenarios")
    .select("id, slug, title, situation, missions, vocabulary, themes, goals, estimated_minutes, fluente_only, units!inner(language, level, position, title, status)")
    .eq("status", "publicado").eq("units.status", "publicado");
  const { data, error } = idioma.success ? await consulta.eq("units.language", idioma.data) : await consulta;
  if (error) throw error;
  type Linha = { id: string; slug: string; title: string; situation: string; missions: string[]; vocabulary: { termo: string; traducao: string }[];
    themes: string[]; goals: string[]; estimated_minutes: number; fluente_only: boolean; units: { language: string; level: string; position: number; title: string } };
  const cenarios = ((data ?? []) as unknown as Linha[])
    .sort((a, b) => a.units.level.localeCompare(b.units.level) || a.units.position - b.units.position)
    .map((c) => ({
      id: c.id, slug: c.slug, idioma: c.units.language, nivel: c.units.level, unidade: c.units.title, titulo: c.title, situacao: c.situation,
      missoes: c.missions, vocabulario: c.vocabulary, temas: c.themes, objetivos: c.goals, minutos: c.estimated_minutes, fluenteOnly: c.fluente_only,
    }));
  return NextResponse.json({ cenarios }, { headers: { "Cache-Control": "public, max-age=60" } });
}
