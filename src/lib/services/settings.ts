import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function lerSettings(sb: SupabaseClient): Promise<Record<string, unknown>> {
  const { data, error } = await sb.from("settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
