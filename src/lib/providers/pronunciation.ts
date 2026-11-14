import "server-only";
import { LANGUAGES, type LangCode } from "@/lib/domain/types";
import { lerChave, lerReferencia } from "@/lib/keys/store";
import { emitirTokenAzure, normalizarRegiao } from "./azureSpeech";

/** PronunciationProvider (Manual 5): Azure Speech com token temporário de 10 min. */
export interface PronunciationToken {
  provider: "azure";
  token: string;
  region: string;
  locale: string;
  prosody: boolean;
}
export interface PronunciationProvider {
  issueToken(language: LangCode): Promise<PronunciationToken>;
}

const LOCALES = Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, v.locale])) as Record<LangCode, string>;

export const azurePronunciation: PronunciationProvider = {
  async issueToken(language) {
    // Chave e região do cofre do painel (Chaves de integração); se não houver, variáveis de ambiente
    const [chave, ref] = await Promise.all([lerChave("azure_speech", "principal"), lerReferencia("azure_speech", "principal")]);
    const regiaoBruta = ref ?? process.env.AZURE_SPEECH_REGION;
    if (!chave || !regiaoBruta) throw new Error("Azure Speech não configurado");
    const region = normalizarRegiao(regiaoBruta);
    return {
      provider: "azure",
      token: await emitirTokenAzure(chave, region),
      region,
      locale: LOCALES[language],
      prosody: language === "en", // prosódia só en-US
    };
  },
};
