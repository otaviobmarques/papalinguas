import { createHmac, timingSafeEqual } from "node:crypto";
import type { Perfil } from "@/lib/admin/permissions";

/** Sessão do painel: token assinado (HMAC-SHA256) em cookie httpOnly; expira em 8 h (Manual 11.4). */
export const COOKIE_ADMIN = "pl_admin";
export const DURACAO_SESSAO_S = 8 * 3600;

export interface TokenAdmin {
  sub: string; // id do admin (ou "env:<usuario>" para o administrador inicial)
  nome: string;
  perfil: Perfil;
  exp: number; // epoch s
}

function segredo(s = process.env.ADMIN_SESSION_SECRET): string {
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET ausente ou curto (mín. 32 caracteres)");
  return s;
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function assinarToken(t: Omit<TokenAdmin, "exp">, agora = Date.now(), chave?: string): string {
  const corpo = b64u(JSON.stringify({ ...t, exp: Math.floor(agora / 1000) + DURACAO_SESSAO_S }));
  const sig = b64u(createHmac("sha256", segredo(chave)).update(corpo).digest());
  return `${corpo}.${sig}`;
}

export function verificarToken(token: string | undefined, agora = Date.now(), chave?: string): TokenAdmin | null {
  if (!token) return null;
  const [corpo, sig] = token.split(".");
  if (!corpo || !sig) return null;
  const esperado = createHmac("sha256", segredo(chave)).update(corpo).digest();
  const recebido = Buffer.from(sig, "base64url");
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return null;
  try {
    const t = JSON.parse(Buffer.from(corpo, "base64url").toString()) as TokenAdmin;
    return t.exp * 1000 > agora ? t : null;
  } catch {
    return null;
  }
}
