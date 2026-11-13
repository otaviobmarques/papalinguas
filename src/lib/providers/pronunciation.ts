import "server-only";
import { serverEnv } from "@/lib/env";

/** PronunciationProvider (Manual 5): Azure Speech com token temporário de 10 min. */
export interface PronunciationToken {
  provider: "azure";
  token: string;
  region: string;
  locale: string;
  prosody: boolean;
}
export interface PronunciationProvider {
  issueToken(language: "en" | "es" | "pt"): Promise<PronunciationToken>;
}

const LOCALES = { en: "en-US", es: "es-MX", pt: "pt-BR" } as const;

export const azurePronunciation: PronunciationProvider = {
  async issueToken(language) {
    const region = serverEnv.azureSpeechRegion();
    const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": serverEnv.azureSpeechKey(), "Content-Length": "0" },
    });
    if (!res.ok) throw new Error(`Azure issueToken falhou: ${res.status}`);
    return {
      provider: "azure",
      token: await res.text(),
      region,
      locale: LOCALES[language],
      prosody: language === "en", // prosódia só en-US
    };
  },
};
