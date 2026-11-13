import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Retorno do login social (Google/Apple) pelo Supabase Auth. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (code) {
    const sb = await supabaseServer();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(destino, url.origin));
}
