import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { lerChave } from "@/lib/keys/store";

/**
 * TextProvider (Manual 5): relatório pós-aula, memória e geração de conteúdo.
 * Principal: OpenAI (modelo de texto). Backup: Anthropic, usado quando a OpenAI falha
 * (erro, limite, chave inválida) — o "plano B" por fornecedor.
 */
export interface PedidoTexto {
  sistema: string;
  usuario: string;
  maxTokens?: number;
}
export interface RespostaTexto {
  texto: string;
  provedor: "openai" | "anthropic";
  modelo: string;
}

async function viaOpenAI(p: PedidoTexto, chave: string): Promise<RespostaTexto> {
  const modelo = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelo, instructions: p.sistema, input: p.usuario, max_output_tokens: p.maxTokens ?? 4000 }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const d = (await r.json()) as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] };
  const texto = d.output_text ?? d.output?.flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text).join("") ?? "";
  return { texto, provedor: "openai", modelo };
}

async function viaAnthropic(p: PedidoTexto, chave: string): Promise<RespostaTexto> {
  const modelo = process.env.ANTHROPIC_TEXT_MODEL || "claude-opus-5-5";
  const client = new Anthropic({ apiKey: chave });
  // Fallback do lado do servidor: se o modelo recusar por categoria de segurança, a API redireciona.
  const msg = await client.beta.messages.create({
    model: modelo,
    max_tokens: p.maxTokens ?? 16000,
    system: p.sistema,
    messages: [{ role: "user", content: p.usuario }],
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
  if (msg.stop_reason === "refusal") throw new Error("Anthropic recusou o pedido");
  const texto = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return { texto, provedor: "anthropic", modelo: msg.model };
}

export async function gerarTexto(p: PedidoTexto): Promise<RespostaTexto> {
  const [openai, anthropic] = await Promise.all([lerChave("openai", "principal"), lerChave("anthropic", "backup")]);
  if (openai) {
    try {
      return await viaOpenAI(p, openai);
    } catch (e) {
      if (!anthropic) throw e;
      console.warn("OpenAI falhou; usando a chave backup da Anthropic", e);
    }
  }
  if (anthropic) return viaAnthropic(p, anthropic);
  throw new Error("Nenhuma chave de texto configurada (OpenAI ou backup Anthropic)");
}
