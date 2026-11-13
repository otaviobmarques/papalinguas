import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import type { Perfil } from "./permissions";

export type SessaoAdmin =
  | { modo: "demo"; perfil: Perfil; nome: string }
  | { modo: "real"; perfil: Perfil; nome: string; id: string }
  | { modo: "negado"; motivo: "sem_login" | "sem_acesso" | "precisa_2fa" | "bloqueado" };

/**
 * Acesso ao painel (Manual 11.4): conta em admin_users, ativa, sem bloqueio,
 * e sessão com 2FA (nível aal2 do Supabase Auth MFA).
 */
export async function sessaoAdmin(): Promise<SessaoAdmin> {
  if (!isSupabaseConfigured()) return { modo: "demo", perfil: "super_admin", nome: "Demonstração" };
  const sb = await supabaseServer();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { modo: "negado", motivo: "sem_login" };
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return { modo: "negado", motivo: "precisa_2fa" };
  const { data: adm } = await supabaseAdmin().from("admin_users").select("id, name, role, active, locked_until").eq("id", u.user.id).maybeSingle();
  if (!adm || !adm.active) return { modo: "negado", motivo: "sem_acesso" };
  if (adm.locked_until && new Date(adm.locked_until) > new Date()) return { modo: "negado", motivo: "bloqueado" };
  return { modo: "real", perfil: adm.role as Perfil, nome: adm.name, id: adm.id };
}
