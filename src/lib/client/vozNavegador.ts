import type { TutorDemo } from "@/lib/demo/data";

/** Idioma/sotaque do tutor para a voz do navegador (só no modo demonstração; a aula real usa a voz da OpenAI). */
export function langDoTutor(t: Pick<TutorDemo, "idioma" | "sotaque">): string {
  if (t.idioma === "en") return t.sotaque === "britânico" ? "en-GB" : "en-US";
  if (t.idioma === "es") return t.sotaque === "espanhol" ? "es-ES" : "es-MX";
  return "pt-BR";
}

const MASC = /\b(male|man|daniel|david|george|arthur|fred|alex|thomas|oliver|rishi|aaron|jorge|diego|juan|pablo|carlos|enrique|felipe|ricardo|antonio|reed|eddy|rocko|grandpa|ralph|guy)\b/i;
const FEM = /\b(female|woman|samantha|karen|moira|serena|martha|kate|susan|victoria|zira|hazel|luciana|paulina|monica|mónica|helena|francisca|joana|fernanda|marisol|sabina|flo|sandy|shelley|grandma)\b/i;

/** Escolhe uma voz instalada do mesmo idioma/sotaque e, quando dá para saber pelo nome, do mesmo gênero do tutor. */
export function vozParaTutor(t: Pick<TutorDemo, "idioma" | "sotaque" | "genero">): SpeechSynthesisVoice | undefined {
  if (typeof speechSynthesis === "undefined") return;
  const lang = langDoTutor(t);
  const todas = speechSynthesis.getVoices();
  const doIdioma = todas.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(lang.toLowerCase()));
  const base = doIdioma.length ? doIdioma : todas.filter((v) => v.lang.toLowerCase().startsWith(t.idioma));
  const certo = t.genero === "masculino" ? MASC : FEM;
  const errado = t.genero === "masculino" ? FEM : MASC;
  return base.find((v) => certo.test(v.name)) ?? base.find((v) => !errado.test(v.name)) ?? base[0];
}
