import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Provedor } from "./store";

export type Validacao = { ok: true } | { ok: false; motivo: string };

/** Confere a chave com uma chamada de leitura barata (lista de modelos), sem gerar custo de uso. */
export async function validarChave(provider: Provedor, chave: string): Promise<Validacao> {
  if (provider === "openai") {
    if (!/^sk-/.test(chave)) return { ok: false, motivo: "Chaves da OpenAI começam com sk-." };
    try {
      const r = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${chave}` } });
      if (r.ok) return { ok: true };
      if (r.status === 401) return { ok: false, motivo: "A OpenAI recusou a chave (401)." };
      if (r.status === 429) return { ok: false, motivo: "Conta sem crédito ou limite atingido (429)." };
      return { ok: false, motivo: `A OpenAI respondeu ${r.status}.` };
    } catch {
      return { ok: false, motivo: "Não foi possível falar com a OpenAI agora." };
    }
  }

  if (!/^sk-ant-/.test(chave)) return { ok: false, motivo: "Chaves da Anthropic começam com sk-ant-." };
  try {
    const client = new Anthropic({ apiKey: chave, maxRetries: 0, timeout: 15_000 });
    await client.models.list({ limit: 1 });
    return { ok: true };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, motivo: "A Anthropic recusou a chave (401)." };
    if (e instanceof Anthropic.PermissionDeniedError) return { ok: false, motivo: "Chave sem permissão (403)." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, motivo: "Limite atingido (429). Tente de novo em instantes." };
    if (e instanceof Anthropic.APIConnectionError) return { ok: false, motivo: "Não foi possível falar com a Anthropic agora." };
    if (e instanceof Anthropic.APIError) return { ok: false, motivo: `A Anthropic respondeu ${e.status}.` };
    return { ok: false, motivo: "Erro inesperado ao validar." };
  }
}
