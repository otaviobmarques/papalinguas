import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PLANOS, PACOTE_EXTRA } from "@/lib/domain/plans";

/** GET /api/planos — catálogo ativo (BRL no MVP; USD na fase 2). */
export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ fonte: "padrao", planos: PLANOS, pacote: PACOTE_EXTRA });
  const { data, error } = await supabaseAdmin().from("plans")
    .select("id, code, name, kind, period, price_brl_cents, minutes_per_cycle, daily_limit_minutes, languages_allowed, validity_days, features, price_version")
    .eq("active", true).order("price_brl_cents");
  if (error) throw error;
  return NextResponse.json({ fonte: "banco", planos: data });
}
