"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditar, sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { cofre, guardarChave, lerChave, type Provedor, type Slot } from "@/lib/keys/store";
import { validarChave } from "@/lib/keys/validate";

export type EstadoForm = { ok?: string; erro?: string } | null;

const SLOT_DE: Record<Provedor, Slot> = { openai: "principal", anthropic: "backup" };
const NOME: Record<Provedor, string> = { openai: "OpenAI (principal)", anthropic: "Anthropic (backup)" };

async function exigirSuperAdmin() {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "gerir_chaves")) throw new Error("Sem permissão");
  return s;
}

export async function salvarChave(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSuperAdmin();
  const p = z.object({
    provider: z.enum(["openai", "anthropic"]),
    chave: z.string().trim().min(20, "Chave muito curta").max(400).regex(/^\S+$/, "A chave não pode ter espaços"),
    motivo: z.string().trim().min(3, "Informe o motivo da alteração").max(200),
  }).safeParse({ provider: form.get("provider"), chave: form.get("chave"), motivo: form.get("motivo") });
  if (!p.success) return { erro: p.error.issues[0].message };

  const v = await validarChave(p.data.provider, p.data.chave);
  if (!v.ok) return { erro: `Chave não salva: ${v.motivo}` };

  const slot = SLOT_DE[p.data.provider];
  const anterior = (await cofre().listar()).find((x) => x.provider === p.data.provider && x.slot === slot);
  await guardarChave({ provider: p.data.provider, slot, valor: p.data.chave, status: "valida", adminId: s.id });
  await auditar(s, anterior ? "chave_substituida" : "chave_cadastrada", { tipo: "integration_key", id: `${p.data.provider}:${slot}` }, {
    antes: anterior ? { final: anterior.last4 } : null,
    depois: { final: p.data.chave.slice(-4) },
    motivo: p.data.motivo,
  });
  revalidatePath("/admin/chaves");
  return { ok: `${NOME[p.data.provider]} validada e salva.` };
}

export async function testarChave(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSuperAdmin();
  const provider = z.enum(["openai", "anthropic"]).parse(form.get("provider"));
  const slot = SLOT_DE[provider];
  const chave = await lerChave(provider, slot);
  if (!chave) return { erro: "Nenhuma chave cadastrada." };
  const v = await validarChave(provider, chave);
  await guardarChave({ provider, slot, valor: chave, status: v.ok ? "valida" : "invalida", adminId: s.id });
  await auditar(s, "chave_testada", { tipo: "integration_key", id: `${provider}:${slot}` }, { depois: { resultado: v.ok ? "valida" : "invalida" } });
  revalidatePath("/admin/chaves");
  return v.ok ? { ok: `${NOME[provider]}: chave funcionando.` } : { erro: `${NOME[provider]}: ${v.motivo}` };
}

export async function removerChave(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSuperAdmin();
  const provider = z.enum(["openai", "anthropic"]).parse(form.get("provider"));
  const motivo = String(form.get("motivo") ?? "").trim();
  if (motivo.length < 3) return { erro: "Informe o motivo da remoção." };
  if (form.get("confirmacao") !== "REMOVER") return { erro: 'Digite REMOVER para confirmar.' };
  await cofre().remover(provider, SLOT_DE[provider]);
  await auditar(s, "chave_removida", { tipo: "integration_key", id: `${provider}:${SLOT_DE[provider]}` }, { motivo });
  revalidatePath("/admin/chaves");
  return { ok: `${NOME[provider]} removida.` };
}
