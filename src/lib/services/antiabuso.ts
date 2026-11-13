import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Marcadores antiabuso (Manual 9.6): um nivelamento e uma garantia por e-mail, dispositivo, CPF e cartão. */
export type TipoId = "cpf" | "email" | "device" | "card";

const pepper = () => process.env.ABUSE_PEPPER || "papalinguas-antiabuso-v1";
export const hashId = (tipo: TipoId, valor: string) =>
  createHash("sha256").update(`${pepper()}:${tipo}:${valor.trim().toLowerCase()}`).digest("hex");

export async function jaUsou(sb: SupabaseClient, kind: "nivelamento" | "garantia", ids: { tipo: TipoId; valor?: string | null }[]) {
  const hashes = ids.filter((i) => i.valor).map((i) => ({ t: i.tipo, h: hashId(i.tipo, i.valor!) }));
  if (!hashes.length) return false;
  const { data } = await sb.from("abuse_markers").select("identifier_type, identifier_hash").eq("kind", kind).in("identifier_hash", hashes.map((x) => x.h));
  return (data ?? []).length > 0;
}

export async function marcarUso(sb: SupabaseClient, kind: "nivelamento" | "garantia", userId: string, ids: { tipo: TipoId; valor?: string | null }[]) {
  const linhas = ids.filter((i) => i.valor).map((i) => ({ kind, identifier_type: i.tipo, identifier_hash: hashId(i.tipo, i.valor!), user_id: userId }));
  if (linhas.length) await sb.from("abuse_markers").upsert(linhas, { onConflict: "kind,identifier_type,identifier_hash", ignoreDuplicates: true });
}
