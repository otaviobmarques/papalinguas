"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditar, sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { blocosCortesia } from "@/lib/domain/cortesia";

export type EstadoCortesia = { ok?: string; erro?: string } | null;

const Form = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  idioma: z.enum(["en", "es", "pt"]),
  plano: z.enum(["essencial", "fluente"]),
  dias: z.coerce.number().refine((d) => [30, 90, 180, 365].includes(d), "Duração inválida"),
  motivo: z.string().trim().min(3, "Informe o motivo (vai para a auditoria)").max(200),
});

/**
 * Cadastra um aluno com assinatura cortesia (sem cobrança): cria a conta de login, o perfil,
 * a assinatura (gateway "cortesia", não renova) e a cota em blocos de 30 dias.
 * O aluno entra pelo app com o mesmo e-mail (código por e-mail) e faz o cadastro inicial;
 * a tela de planos é pulada porque a assinatura já está ativa.
 */
export async function concederCortesia(_: EstadoCortesia, form: FormData): Promise<EstadoCortesia> {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "conceder_cortesia")) return { erro: "Sem permissão." };
  if (!isSupabaseConfigured()) return { erro: "Banco não configurado." };
  const p = Form.safeParse(Object.fromEntries(form));
  if (!p.success) return { erro: p.error.issues[0].message };
  const { nome, email, idioma, plano, dias, motivo } = p.data;
  const sb = supabaseAdmin();

  // 1. Conta de login (reaproveita se o e-mail já existir)
  let userId: string | null = null;
  const { data: existente } = await sb.from("users").select("id").ilike("email", email).maybeSingle();
  if (existente) userId = existente.id;
  else {
    const { data: criado, error } = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name: nome } });
    if (criado?.user) userId = criado.user.id;
    else if (error && /already|registered|exists/i.test(error.message)) {
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
        userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
        if (data.users.length < 200) break;
      }
    } else if (error) return { erro: `Não foi possível criar o login: ${error.message}` };
  }
  if (!userId) return { erro: "Não foi possível localizar a conta desse e-mail." };

  // 2. Cadastro e perfil
  const { error: eU } = await sb.from("users").upsert({ id: userId, email, name: nome }, { onConflict: "id", ignoreDuplicates: false });
  if (eU) return { erro: eU.message };
  await sb.from("profiles").upsert({ user_id: userId, target_language: idioma }, { onConflict: "user_id,target_language", ignoreDuplicates: true });

  // 3. Não sobrepor assinatura ativa
  const { data: ativa } = await sb.from("subscriptions").select("id").eq("user_id", userId).in("status", ["ativa", "em_garantia", "inadimplente"]).limit(1).maybeSingle();
  if (ativa) return { erro: "Este aluno já tem uma assinatura ativa." };

  const { data: pl } = await sb.from("plans").select("id, minutes_per_cycle").eq("code", plano).eq("period", "mensal").eq("active", true)
    .order("price_version", { ascending: false }).limit(1).maybeSingle();
  if (!pl) return { erro: "Plano não encontrado." };

  const inicio = new Date();
  const blocos = blocosCortesia(inicio, dias, pl.minutes_per_cycle);
  const fim = blocos.at(-1)!.fim;

  const { data: sub, error: eS } = await sb.from("subscriptions").insert({
    user_id: userId, plan_id: pl.id, gateway: "cortesia", status: "ativa", is_first_subscription: false,
    started_at: inicio.toISOString(), current_period_start: inicio.toISOString(), current_period_end: fim.toISOString(), cancel_at_period_end: true,
  }).select("id").single();
  if (eS) return { erro: eS.message };

  const { error: eC } = await sb.from("usage_counters").insert(blocos.map((b) => ({
    user_id: userId, subscription_id: sub.id, cycle_start: b.inicio.toISOString(), cycle_end: b.fim.toISOString(), cycle_seconds_quota: b.segundos,
  })));
  if (eC) return { erro: eC.message };

  await auditar(s, "cortesia_concedida", { tipo: "user", id: userId }, { depois: { plano, dias, ate: fim.toISOString() }, motivo });
  revalidatePath("/admin/alunos");
  return { ok: `Cortesia criada: ${plano === "fluente" ? "Fluente" : "Essencial"} até ${fim.toLocaleDateString("pt-BR")}. Peça ao aluno para abrir o app, tocar em "Começar agora" e entrar com ${email}.` };
}

/** Encerra a cortesia antes do fim (sem cobrança envolvida). */
export async function encerrarCortesia(_: EstadoCortesia, form: FormData): Promise<EstadoCortesia> {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "conceder_cortesia")) return { erro: "Sem permissão." };
  const id = z.string().uuid().safeParse(form.get("assinaturaId"));
  const motivo = String(form.get("motivo") ?? "").trim();
  if (!id.success) return { erro: "Assinatura inválida." };
  if (motivo.length < 3) return { erro: "Informe o motivo." };
  const sb = supabaseAdmin();
  const agora = new Date().toISOString();
  const { data } = await sb.from("subscriptions").update({ status: "cancelada", canceled_at: agora, ended_at: agora, current_period_end: agora })
    .eq("id", id.data).eq("gateway", "cortesia").select("user_id").maybeSingle();
  if (!data) return { erro: "Cortesia não encontrada." };
  await sb.from("usage_counters").update({ cycle_end: agora }).eq("subscription_id", id.data).gt("cycle_end", agora);
  await auditar(s, "cortesia_encerrada", { tipo: "user", id: data.user_id }, { motivo });
  revalidatePath("/admin/alunos");
  return { ok: "Cortesia encerrada." };
}
