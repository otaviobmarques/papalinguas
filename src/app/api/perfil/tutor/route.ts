import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { erro, exigeBackend } from "@/lib/services/http";

const Corpo = z.object({ slug: z.string().min(1).max(40) });

/**
 * POST /api/perfil/tutor — troca o tutor do aluno.
 * O tutor define o idioma: se for de outro idioma, esse passa a ser o idioma principal de estudo
 * (cria o perfil do idioma se ainda não existir, mantendo os outros guardados).
 */
export async function POST(req: Request) {
  const demo = exigeBackend();
  if (demo) return demo;
  const user = await requireUser();
  if (!user) return erro(401, "nao_autenticado");
  const p = Corpo.safeParse(await req.json().catch(() => null));
  if (!p.success) return erro(400, "dados_invalidos");
  const sb = supabaseAdmin();

  const { data: tutor } = await sb.from("tutors").select("id, slug, name, language").eq("slug", p.data.slug).eq("active", true).maybeSingle();
  if (!tutor) return erro(404, "tutor_inexistente", "Tutor não encontrado.");

  const { data: perfis, error: eP } = await sb.from("profiles").select("id, target_language").eq("user_id", user.id);
  if (eP) throw eP;
  const existente = (perfis ?? []).find((x) => x.target_language === tutor.language);

  if (existente) {
    const { error } = await sb.from("profiles").update({ tutor_id: tutor.id, is_primary: true }).eq("id", existente.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("profiles").insert({ user_id: user.id, target_language: tutor.language, tutor_id: tutor.id, is_primary: true });
    if (error) throw error;
  }
  // só um idioma principal por vez
  const { error: eO } = await sb.from("profiles").update({ is_primary: false }).eq("user_id", user.id).neq("target_language", tutor.language);
  if (eO) throw eO;

  return NextResponse.json({ ok: true, tutor: { slug: tutor.slug, nome: tutor.name, idioma: tutor.language }, idiomaNovo: !existente });
}
