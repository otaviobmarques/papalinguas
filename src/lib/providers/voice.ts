import "server-only";
import { serverEnv } from "@/lib/env";

/** VoiceProvider (Manual 5): troca de fornecedor sem nova versão do app. */
export interface VoiceSessionRequest {
  instructions: string;
  voice: string;
  model?: string;
  maxSeconds: number;
}
export interface VoiceSessionCredentials {
  provider: "openai";
  model: string;
  clientSecret: string;
  expiresAt: number; // epoch s
  connectUrl: string; // o navegador faz o POST do SDP aqui
}
export interface VoiceProvider {
  createEphemeralSession(req: VoiceSessionRequest): Promise<VoiceSessionCredentials>;
}

/**
 * OpenAI Realtime por WebRTC com chave temporária (Manual 3.2).
 * A chave secreta fica no servidor; o navegador só recebe o client secret de curta duração.
 */
export const openAIVoice: VoiceProvider = {
  async createEphemeralSession({ instructions, voice, model, maxSeconds }) {
    const m = model ?? serverEnv.openaiRealtimeModel();
    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${serverEnv.openaiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // a chave só precisa valer o suficiente para conectar; a sessão é encerrada pelo heartbeat
        expires_after: { anchor: "created_at", seconds: Math.min(600, Math.max(60, maxSeconds)) },
        session: {
          type: "realtime",
          model: m,
          instructions,
          audio: {
            input: { transcription: { model: "gpt-4o-mini-transcribe" }, turn_detection: { type: "semantic_vad" } },
            output: { voice },
          },
        },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI client_secrets falhou: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { value: string; expires_at: number };
    return {
      provider: "openai",
      model: m,
      clientSecret: data.value,
      expiresAt: data.expires_at,
      connectUrl: "https://api.openai.com/v1/realtime/calls",
    };
  },
};
