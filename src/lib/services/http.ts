import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export const erro = (status: number, codigo: string, mensagem?: string) =>
  NextResponse.json({ erro: codigo, mensagem }, { status });

/** Em modo demonstração (sem Supabase), as rotas respondem 503 e o app usa dados locais. */
export function exigeBackend() {
  return isSupabaseConfigured() ? null : erro(503, "modo_demo", "Backend não configurado (veja .env.example).");
}
