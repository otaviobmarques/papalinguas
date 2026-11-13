import "server-only";
import { cookies, headers } from "next/headers";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { conferirSenha } from "@/lib/security/password";
import { assinarToken, COOKIE_ADMIN, DURACAO_SESSAO_S, verificarToken } from "@/lib/security/adminSession";
import type { Perfil } from "./permissions";

export type SessaoAdmin = { id: string; nome: string; perfil: Perfil };

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60_000;
const tentativasMemoria = new Map<string, { n: number; ate?: number }>();

/** Sessão atual do painel (cookie assinado). null = não autenticado. */
export async function sessaoAdmin(): Promise<SessaoAdmin | null> {
  const t = verificarToken((await cookies()).get(COOKIE_ADMIN)?.value);
  return t ? { id: t.sub, nome: t.nome, perfil: t.perfil } : null;
}

export async function ipRequisicao(): Promise<string | null> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/** Registra ação administrativa na auditoria (somente inclusão). Nunca grava valores de chaves. */
export async function auditar(s: SessaoAdmin, acao: string, alvo: { tipo: string; id: string }, extra?: { antes?: unknown; depois?: unknown; motivo?: string }) {
  const ip = await ipRequisicao();
  if (!isSupabaseConfigured()) {
    console.info("[auditoria]", JSON.stringify({ admin: s.id, acao, alvo, ...extra, ip }));
    return;
  }
  await supabaseAdmin().from("audit_log").insert({
    admin_id: s.id.startsWith("env:") ? null : s.id,
    action: acao, target_type: alvo.tipo, target_id: alvo.id,
    before: extra?.antes ?? null, after: { ...(extra?.depois as object), por: s.nome }, reason: extra?.motivo ?? null, ip,
  });
}

type ResultadoLogin = { ok: true } | { ok: false; erro: string };

/**
 * Login por usuário e senha (Manual 11.4: bloqueio após 5 tentativas; sessão de 8 h).
 * 1) admin_users no banco (senha com hash scrypt);
 * 2) administrador inicial definido por ADMIN_USERNAME + ADMIN_PASSWORD_HASH (Super Admin).
 */
export async function entrar(usuario: string, senha: string): Promise<ResultadoLogin> {
  const u = usuario.trim().toLowerCase();
  const memo = tentativasMemoria.get(u);
  if (memo?.ate && memo.ate > Date.now()) return { ok: false, erro: "Acesso bloqueado por 15 minutos após tentativas erradas." };

  let sessao: SessaoAdmin | null = null;

  if (isSupabaseConfigured()) {
    const sb = supabaseAdmin();
    const { data: adm } = await sb.from("admin_users")
      .select("id, name, role, active, password_hash, failed_logins, locked_until").ilike("username", u).maybeSingle();
    if (adm) {
      if (!adm.active) return { ok: false, erro: "Usuário desativado." };
      if (adm.locked_until && new Date(adm.locked_until) > new Date()) return { ok: false, erro: "Acesso bloqueado por 15 minutos após tentativas erradas." };
      if (adm.password_hash && (await conferirSenha(senha, adm.password_hash))) {
        await sb.from("admin_users").update({ failed_logins: 0, locked_until: null, last_login_at: new Date().toISOString() }).eq("id", adm.id);
        sessao = { id: adm.id, nome: adm.name, perfil: adm.role as Perfil };
      } else {
        const n = (adm.failed_logins ?? 0) + 1;
        await sb.from("admin_users").update({
          failed_logins: n, locked_until: n >= MAX_TENTATIVAS ? new Date(Date.now() + BLOQUEIO_MS).toISOString() : null,
        }).eq("id", adm.id);
        return { ok: false, erro: "Usuário ou senha incorretos." };
      }
    }
  }

  if (!sessao) {
    const envUser = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    const envHash = process.env.ADMIN_PASSWORD_HASH;
    if (envUser && envHash && u === envUser && (await conferirSenha(senha, envHash))) {
      sessao = { id: `env:${envUser}`, nome: process.env.ADMIN_USERNAME!.trim(), perfil: "super_admin" };
    }
  }

  if (!sessao) {
    const n = (memo?.n ?? 0) + 1;
    tentativasMemoria.set(u, { n, ate: n >= MAX_TENTATIVAS ? Date.now() + BLOQUEIO_MS : undefined });
    return { ok: false, erro: "Usuário ou senha incorretos." };
  }

  tentativasMemoria.delete(u);
  (await cookies()).set(COOKIE_ADMIN, assinarToken({ sub: sessao.id, nome: sessao.nome, perfil: sessao.perfil }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: DURACAO_SESSAO_S,
  });
  await auditar(sessao, "login", { tipo: "admin", id: sessao.id });
  return { ok: true };
}

export async function sair() {
  (await cookies()).delete({ name: COOKIE_ADMIN, path: "/admin" });
}
