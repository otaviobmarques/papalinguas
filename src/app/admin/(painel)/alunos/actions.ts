"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditar, sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { blocosCortesia } from "@/lib/domain/cortesia";
import { gerarSenha, linkDeAcesso, mensagemDeConvite } from "@/lib/domain/acesso";

export interface Convite { link: string; email: string; senha?: string; mensagem: string }
export type EstadoCortesia = { ok?: string; erro?: string; convite?: Convite } | null;

const Form = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  idioma: z.enum(["en", "es", "pt"]),
  plano: z.enum(["essencial", "fluente"]),
  dias: z.coerce.number().refine((d) => [30, 90, 180, 365].includes(d), "Duração inválida"),
  motivo: z.string().trim().min(3, "Informe o motivo (vai para a auditoria)").max(200),
  senha: z.string().max(72).optional().transform((v) => (v ? v : undefined))
    .refine((v) => !v || v.length >= 8, "A senha precisa ter pelo menos 8 caracteres"),
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
  const { nome, email, idioma, plano, dias, motivo, senha } = p.data;
  const sb = supabaseAdmin();

  // 1. Conta de login (reaproveita se o e-mail já existir)
  let userId: string | null = null;
  const { data: existente } = await sb.from("users").select("id").ilike("email", email).maybeSingle();
  if (existente) userId = existente.id;
  else {
    const { data: criado, error } = await sb.auth.admin.createUser({ email, email_confirm: true, password: senha, user_metadata: { name: nome } });
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
  // conta que já existia: define a senha escolhida pelo admin
  if (senha) {
    const { error } = await sb.auth.admin.updateUserById(userId, { password: senha });
    if (error) return { erro: `Não foi possível definir a senha: ${error.message}` };
  }

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

  // a senha nunca vai para a auditoria nem para o banco do app (fica só no Supabase Auth, criptografada)
  await auditar(s, "cortesia_concedida", { tipo: "user", id: userId }, { depois: { plano, dias, ate: fim.toISOString(), senhaDefinida: !!senha }, motivo });
  revalidatePath("/admin/alunos");
  const nomePlano = plano === "fluente" ? "Fluente" : "Essencial";
  const ate = fim.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const link = linkDeAcesso(email, !!senha);
  const mensagem = mensagemDeConvite({ nome, plano: nomePlano, ate, email, link, senha });
  return { ok: `Cortesia criada: ${nomePlano} até ${ate}.`, convite: { link, email, senha, mensagem } };
}

/** Gera uma senha nova para um aluno cortesia e devolve o link e a mensagem para reenviar. */
export async function novoAcesso(_: EstadoCortesia, form: FormData): Promise<EstadoCortesia> {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "conceder_cortesia")) return { erro: "Sem permissão." };
  const id = z.string().uuid().safeParse(form.get("userId"));
  if (!id.success) return { erro: "Aluno inválido." };
  const sb = supabaseAdmin();
  const { data: u } = await sb.from("users").select("email, name").eq("id", id.data).maybeSingle();
  const { data: sub } = await sb.from("subscriptions").select("current_period_end, plans!subscriptions_plan_id_fkey(code)")
    .eq("user_id", id.data).eq("gateway", "cortesia").eq("status", "ativa").order("current_period_end", { ascending: false }).limit(1).maybeSingle();
  if (!u?.email || !sub) return { erro: "Este aluno não tem cortesia ativa." };
  const senha = gerarSenha();
  const { error } = await sb.auth.admin.updateUserById(id.data, { password: senha });
  if (error) return { erro: `Não foi possível definir a senha: ${error.message}` };
  await auditar(s, "cortesia_novo_acesso", { tipo: "user", id: id.data }, { motivo: "nova senha gerada pelo painel" });
  const plano = (sub.plans as unknown as { code?: string } | null)?.code === "fluente" ? "Fluente" : "Essencial";
  const ate = new Date(sub.current_period_end).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const link = linkDeAcesso(u.email, true);
  return { ok: "Nova senha gerada. A anterior deixou de funcionar.", convite: { link, email: u.email, senha, mensagem: mensagemDeConvite({ nome: u.name ?? "", plano, ate, email: u.email, link, senha }) } };
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
