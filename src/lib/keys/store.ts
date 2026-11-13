import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cifrar, decifrar } from "@/lib/security/secretBox";

/** Cofre de chaves de integração (painel → Chaves de integração). */
export type Provedor = "openai" | "anthropic";
export type Slot = "principal" | "backup";
export type StatusChave = "valida" | "invalida" | "nao_validada";

export interface RegistroChave {
  provider: Provedor;
  slot: Slot;
  ciphertext: string;
  last4: string;
  status: StatusChave;
  validated_at: string | null;
  updated_at: string;
}

interface Store {
  listar(): Promise<RegistroChave[]>;
  salvar(r: Omit<RegistroChave, "updated_at">, adminId?: string): Promise<void>;
  remover(provider: Provedor, slot: Slot): Promise<void>;
}

/** Produção: tabela integration_keys (só service role). */
const supabaseStore: Store = {
  async listar() {
    const { data, error } = await supabaseAdmin().from("integration_keys")
      .select("provider, slot, ciphertext, last4, status, validated_at, updated_at");
    if (error) throw error;
    return (data ?? []) as RegistroChave[];
  },
  async salvar(r, adminId) {
    const { error } = await supabaseAdmin().from("integration_keys").upsert(
      { ...r, updated_by: adminId && !adminId.startsWith("env:") ? adminId : null },
      { onConflict: "provider,slot" },
    );
    if (error) throw error;
  },
  async remover(provider, slot) {
    const { error } = await supabaseAdmin().from("integration_keys").delete().eq("provider", provider).eq("slot", slot);
    if (error) throw error;
  },
};

/** Desenvolvimento sem Supabase: arquivo local cifrado em .data/ (ignorado pelo git). */
const ARQ = path.join(process.cwd(), ".data", "integration-keys.json");
const arquivoStore: Store = {
  async listar() {
    try {
      return JSON.parse(await fs.readFile(ARQ, "utf8")) as RegistroChave[];
    } catch {
      return [];
    }
  },
  async salvar(r) {
    if (process.env.VERCEL) {
      throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY na Vercel para salvar chaves (o disco do servidor é somente leitura).");
    }
    const lista = (await this.listar()).filter((x) => !(x.provider === r.provider && x.slot === r.slot));
    lista.push({ ...r, updated_at: new Date().toISOString() });
    await fs.mkdir(path.dirname(ARQ), { recursive: true, mode: 0o700 });
    await fs.writeFile(ARQ, JSON.stringify(lista, null, 2), { mode: 0o600 });
  },
  async remover(provider, slot) {
    const lista = (await this.listar()).filter((x) => !(x.provider === provider && x.slot === slot));
    await fs.mkdir(path.dirname(ARQ), { recursive: true, mode: 0o700 });
    await fs.writeFile(ARQ, JSON.stringify(lista, null, 2), { mode: 0o600 });
  },
};

export const cofre = (): Store => (isSupabaseConfigured() ? supabaseStore : arquivoStore);

export async function guardarChave(p: { provider: Provedor; slot: Slot; valor: string; status: StatusChave; adminId?: string }) {
  await cofre().salvar(
    {
      provider: p.provider,
      slot: p.slot,
      ciphertext: cifrar(p.valor),
      last4: p.valor.slice(-4),
      status: p.status,
      validated_at: p.status === "valida" ? new Date().toISOString() : null,
    },
    p.adminId,
  );
}

/** Lê a chave em texto (só no servidor, no momento do uso). Cofre primeiro, variável de ambiente depois. */
export async function lerChave(provider: Provedor, slot: Slot = "principal"): Promise<string | null> {
  try {
    const r = (await cofre().listar()).find((x) => x.provider === provider && x.slot === slot);
    if (r) return decifrar(r.ciphertext);
  } catch (e) {
    console.error("cofre de chaves indisponível", e);
  }
  if (slot === "principal") {
    const env = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
    return env && env.length > 0 ? env : null;
  }
  return null;
}
