"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auditar, sessaoAdmin } from "@/lib/admin/auth";
import { pode } from "@/lib/admin/permissions";
import { cofre, guardarChave, lerChave, lerReferencia, type Provedor, type Slot } from "@/lib/keys/store";
import { normalizarRegiao } from "@/lib/providers/azureSpeech";
import { validarChave } from "@/lib/keys/validate";
import { registrarWebhookAsaas, validarAsaas } from "@/lib/providers/payments/asaasSetup";

export type EstadoForm = { ok?: string; erro?: string } | null;

const SLOT_DE: Record<Provedor, Slot> = { openai: "principal", anthropic: "backup", asaas: "principal", azure_speech: "principal" };
const NOME: Record<Provedor, string> = { openai: "OpenAI (principal)", anthropic: "Anthropic (backup)", asaas: "Asaas (pagamentos)", azure_speech: "Azure Speech (pronúncia)" };
const PROVEDORES = ["openai", "anthropic", "asaas", "azure_speech"] as const;

/** Endereço público do app, para o Asaas avisar os pagamentos. */
async function urlWebhook() {
  const base = process.env.NEXT_PUBLIC_APP_URL || `https://${(await headers()).get("host")}`;
  return `${base.replace(/\/$/, "")}/api/webhooks/asaas`;
}

async function configurarWebhook(chave: string, adminId: string) {
  const conta = await validarAsaas(chave);
  if (!conta.ok) throw new Error(conta.motivo);
  const anterior = (await cofre().listar()).find((x) => x.provider === "asaas" && x.slot === "webhook");
  const wh = await registrarWebhookAsaas({ chave, url: await urlWebhook(), email: conta.email, idExistente: anterior?.external_ref });
  await guardarChave({ provider: "asaas", slot: "webhook", valor: wh.token, status: "valida", adminId, externalRef: wh.id });
  return wh.id;
}

async function exigirSuperAdmin() {
  const s = await sessaoAdmin();
  if (!s || !pode(s.perfil, "gerir_chaves")) throw new Error("Sem permissão");
  return s;
}

export async function salvarChave(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSuperAdmin();
  const p = z.object({
    provider: z.enum(PROVEDORES),
    chave: z.string().trim().min(20, "Chave muito curta").max(400).regex(/^\S+$/, "A chave não pode ter espaços"),
    motivo: z.string().trim().min(3, "Informe o motivo da alteração").max(200),
    regiao: z.string().trim().max(40).optional(),
  }).safeParse({ provider: form.get("provider"), chave: form.get("chave"), motivo: form.get("motivo"), regiao: form.get("regiao") ?? undefined });
  if (!p.success) return { erro: p.error.issues[0].message };
  const regiaoInformada = p.data.provider === "azure_speech" ? normalizarRegiao(p.data.regiao ?? "") : null;

  const v = await validarChave(p.data.provider, p.data.chave, regiaoInformada);
  if (!v.ok) return { erro: `Chave não salva: ${v.motivo}` };
  const regiao = p.data.provider === "azure_speech" ? (v.regiao ?? regiaoInformada) : null;

  const slot = SLOT_DE[p.data.provider];
  const anterior = (await cofre().listar()).find((x) => x.provider === p.data.provider && x.slot === slot);
  await guardarChave({ provider: p.data.provider, slot, valor: p.data.chave, status: "valida", adminId: s.id, ...(regiao ? { externalRef: regiao } : {}) });
  let extra = regiao ? ` Região: ${regiao}${v.regiao ? " (detectada automaticamente)" : ""}.` : "";
  if (p.data.provider === "asaas") {
    try {
      const id = await configurarWebhook(p.data.chave, s.id);
      await auditar(s, "webhook_configurado", { tipo: "integration_key", id: "asaas:webhook" }, { depois: { webhook: id } });
      extra = " Webhook de pagamentos configurado no Asaas.";
    } catch (e) {
      extra = ` Atenção: a chave foi salva, mas o webhook não foi configurado (${e instanceof Error ? e.message : "erro"}). Use "Testar chave" para tentar de novo.`;
    }
  }
  await auditar(s, anterior ? "chave_substituida" : "chave_cadastrada", { tipo: "integration_key", id: `${p.data.provider}:${slot}` }, {
    antes: anterior ? { final: anterior.last4 } : null,
    depois: { final: p.data.chave.slice(-4) },
    motivo: p.data.motivo,
  });
  revalidatePath("/admin/chaves");
  return { ok: `${NOME[p.data.provider]} validada e salva.${extra}` };
}

export async function testarChave(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSuperAdmin();
  const provider = z.enum(PROVEDORES).parse(form.get("provider"));
  const slot = SLOT_DE[provider];
  const chave = await lerChave(provider, slot);
  if (!chave) return { erro: "Nenhuma chave cadastrada." };
  const v = await validarChave(provider, chave, provider === "azure_speech" ? await lerReferencia("azure_speech", "principal") : null);
  await guardarChave({ provider, slot, valor: chave, status: v.ok ? "valida" : "invalida", adminId: s.id });
  await auditar(s, "chave_testada", { tipo: "integration_key", id: `${provider}:${slot}` }, { depois: { resultado: v.ok ? "valida" : "invalida" } });
  if (v.ok && provider === "asaas" && !(await lerChave("asaas", "webhook"))) {
    try {
      await configurarWebhook(chave, s.id);
      revalidatePath("/admin/chaves");
      return { ok: "Asaas: chave funcionando e webhook configurado." };
    } catch (e) {
      return { erro: `Asaas: chave funcionando, mas o webhook falhou (${e instanceof Error ? e.message : "erro"}).` };
    }
  }
  revalidatePath("/admin/chaves");
  return v.ok ? { ok: `${NOME[provider]}: chave funcionando.` } : { erro: `${NOME[provider]}: ${v.motivo}` };
}

export async function removerChave(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const s = await exigirSuperAdmin();
  const provider = z.enum(PROVEDORES).parse(form.get("provider"));
  const motivo = String(form.get("motivo") ?? "").trim();
  if (motivo.length < 3) return { erro: "Informe o motivo da remoção." };
  if (form.get("confirmacao") !== "REMOVER") return { erro: 'Digite REMOVER para confirmar.' };
  await cofre().remover(provider, SLOT_DE[provider]);
  if (provider === "asaas") await cofre().remover("asaas", "webhook");
  await auditar(s, "chave_removida", { tipo: "integration_key", id: `${provider}:${SLOT_DE[provider]}` }, { motivo });
  revalidatePath("/admin/chaves");
  return { ok: `${NOME[provider]} removida.` };
}
