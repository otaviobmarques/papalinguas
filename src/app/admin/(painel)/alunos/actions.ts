"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LANG_CODES } from "@/lib/domain/types";
import { auditar, sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { blocosCortesia, mascararEmail } from "@/lib/domain/cortesia";
import { gerarSenha, linkDeAcesso, mensagemDeConvite } from "@/lib/domain/acesso";

export interface Convite { link: string; email: string; senha?: string; mensagem: string }
export type EstadoCortesia = { ok?: string; erro?: string; convite?: Convite; excluido?: boolean } | null;

const Form = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  idioma: z.enum(LANG_CODES),
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

// ---------- Ficha do aluno: editar, bloquear, desbloquear, excluir ----------

const Edicao = z.object({
  userId: z.string().uuid(),
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().max(72).optional().transform((v) => (v ? v : undefined))
    .refine((v) => !v || v.length >= 8, "A senha precisa ter pelo menos 8 caracteres"),
});

/** Edita nome, e-mail e (opcionalmente) a senha. Se a senha mudar, devolve a mensagem para reenviar. */
export async function editarAluno(_: EstadoCortesia, form: FormData): Promise<EstadoCortesia> {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "editar_aluno")) return { erro: "Sem permissão." };
  if (!isSupabaseConfigured()) return { erro: "Banco não configurado." };
  const p = Edicao.safeParse(Object.fromEntries(form));
  if (!p.success) return { erro: p.error.issues[0].message };
  const { userId, nome, email, senha } = p.data;
  const sb = supabaseAdmin();
  const { data: antes } = await sb.from("users").select("email, name").eq("id", userId).maybeSingle();
  if (!antes) return { erro: "Aluno não encontrado." };

  if (email !== antes.email.toLowerCase()) {
    const { data: outro } = await sb.from("users").select("id").ilike("email", email).neq("id", userId).maybeSingle();
    if (outro) return { erro: "Já existe outro aluno com esse e-mail." };
  }
  // e-mail confirmado pelo admin: não pede confirmação ao aluno
  const { error: eA } = await sb.auth.admin.updateUserById(userId, { email, email_confirm: true, password: senha, user_metadata: { name: nome } });
  if (eA) return { erro: `Não foi possível salvar o login: ${eA.message}` };
  const { error: eU } = await sb.from("users").update({ name: nome, email }).eq("id", userId);
  if (eU) return { erro: eU.message };

  await auditar(s, "aluno_editado", { tipo: "user", id: userId }, {
    antes: { nome: antes.name, email: antes.email }, depois: { nome, email, senhaAlterada: !!senha }, motivo: "edição pelo painel",
  });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${userId}`);
  if (!senha) return { ok: "Dados do aluno salvos." };

  const { data: sub } = await sb.from("subscriptions").select("current_period_end, plans!subscriptions_plan_id_fkey(code)")
    .eq("user_id", userId).in("status", ["ativa", "em_garantia"]).order("current_period_end", { ascending: false }).limit(1).maybeSingle();
  const plano = (sub?.plans as unknown as { code?: string } | null)?.code === "fluente" ? "Fluente" : "Essencial";
  const ate = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "o fim do período";
  const link = linkDeAcesso(email, true);
  return {
    ok: "Dados salvos e senha alterada. A senha anterior deixou de funcionar.",
    convite: { link, email, senha, mensagem: mensagemDeConvite({ nome, plano, ate, email, link, senha }) },
  };
}

const NUNCA = "876000h"; // ~100 anos: bloqueio de login no Supabase Auth até desbloquear

/** Bloqueia o aluno: não entra no app (login recusado) e não abre aula. Reversível. */
export async function bloquearAluno(_: EstadoCortesia, form: FormData): Promise<EstadoCortesia> {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "suspender")) return { erro: "Sem permissão." };
  const id = z.string().uuid().safeParse(form.get("userId"));
  const motivo = String(form.get("motivo") ?? "").trim();
  if (!id.success) return { erro: "Aluno inválido." };
  if (motivo.length < 3) return { erro: "Informe o motivo do bloqueio." };
  const sb = supabaseAdmin();
  const { error: eA } = await sb.auth.admin.updateUserById(id.data, { ban_duration: NUNCA });
  if (eA) return { erro: `Não foi possível bloquear o login: ${eA.message}` };
  const { error } = await sb.from("users").update({ status: "suspenso", suspended_until: null }).eq("id", id.data);
  if (error) return { erro: error.message };
  await auditar(s, "aluno_bloqueado", { tipo: "user", id: id.data }, { depois: { status: "suspenso" }, motivo });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${id.data}`);
  return { ok: "Aluno bloqueado. Ele não consegue mais entrar nem iniciar aulas." };
}

export async function desbloquearAluno(_: EstadoCortesia, form: FormData): Promise<EstadoCortesia> {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "suspender")) return { erro: "Sem permissão." };
  const id = z.string().uuid().safeParse(form.get("userId"));
  if (!id.success) return { erro: "Aluno inválido." };
  const sb = supabaseAdmin();
  const { error: eA } = await sb.auth.admin.updateUserById(id.data, { ban_duration: "none" });
  if (eA) return { erro: `Não foi possível desbloquear o login: ${eA.message}` };
  const { error } = await sb.from("users").update({ status: "ativo", suspended_until: null }).eq("id", id.data).eq("status", "suspenso");
  if (error) return { erro: error.message };
  await auditar(s, "aluno_desbloqueado", { tipo: "user", id: id.data }, { depois: { status: "ativo" }, motivo: "desbloqueio pelo painel" });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${id.data}`);
  return { ok: "Aluno desbloqueado." };
}

/**
 * Exclui o aluno. Super Admin: exclusão definitiva (login e dados do app; notas fiscais e pagamentos
 * ficam sem vínculo, por obrigação fiscal). Administrador: exclusão lógica (bloqueia e marca para exclusão).
 * Confirmação: digitar o e-mail do aluno + motivo.
 */
export async function excluirAluno(_: EstadoCortesia, form: FormData): Promise<EstadoCortesia> {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "excluir_logico")) return { erro: "Sem permissão." };
  const id = z.string().uuid().safeParse(form.get("userId"));
  const confirmacao = String(form.get("confirmacao") ?? "").trim().toLowerCase();
  const motivo = String(form.get("motivo") ?? "").trim();
  if (!id.success) return { erro: "Aluno inválido." };
  if (motivo.length < 3) return { erro: "Informe o motivo da exclusão." };
  const sb = supabaseAdmin();
  const { data: u } = await sb.from("users").select("email").eq("id", id.data).maybeSingle();
  if (!u) return { erro: "Aluno não encontrado." };
  if (confirmacao !== u.email.toLowerCase()) return { erro: "Para confirmar, digite exatamente o e-mail do aluno." };

  const agora = new Date().toISOString();
  // assinaturas ativas param de valer (cortesia ou paga; reembolso é tratado à parte)
  await sb.from("subscriptions").update({ status: "cancelada", canceled_at: agora, ended_at: agora, cancel_at_period_end: true })
    .eq("user_id", id.data).in("status", ["pendente", "em_garantia", "ativa", "inadimplente"]);

  if (pode(s.perfil, "excluir_definitivo")) {
    await auditar(s, "aluno_excluido_definitivo", { tipo: "user", id: id.data }, { antes: { email: mascararEmail(u.email) }, motivo });
    const { error } = await sb.auth.admin.deleteUser(id.data); // apaga em cascata os dados do app
    if (error) return { erro: `Não foi possível excluir: ${error.message}` };
    revalidatePath("/admin/alunos");
    return { ok: "Aluno excluído definitivamente.", excluido: true };
  }
  await sb.auth.admin.updateUserById(id.data, { ban_duration: NUNCA });
  await sb.from("users").update({ status: "em_exclusao", deletion_requested_at: agora }).eq("id", id.data);
  await auditar(s, "aluno_excluido_logico", { tipo: "user", id: id.data }, { antes: { email: mascararEmail(u.email) }, depois: { status: "em_exclusao" }, motivo });
  revalidatePath("/admin/alunos");
  return { ok: "Aluno bloqueado e marcado para exclusão. A exclusão definitiva é feita pelo Super Admin.", excluido: true };
}
