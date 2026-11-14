import { describe, expect, it } from "vitest";
import { calibrarVelocidade, dividirLegenda, trechoAtual } from "@/lib/domain/legenda";

describe("dividirLegenda", () => {
  it("corta nas frases", () => {
    expect(dividirLegenda("Bonjour! Comment ça va? Très bien.")).toEqual(["Bonjour!", "Comment ça va?", "Très bien."]);
  });
  it("limita o tamanho do trecho", () => {
    const t = dividirLegenda("um dois três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze", 7);
    expect(t.every((x) => x.split(" ").length <= 9)).toBe(true);
    expect(t.join(" ")).toBe("um dois três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze");
  });
  it("prefere cortar na vírgula", () => {
    expect(dividirLegenda("Muito bem, agora repita comigo: je suis désolé.")).toEqual(["Muito bem, agora repita comigo:", "je suis désolé."]);
  });
  it("não deixa pedaço solto no fim da frase", () => {
    expect(dividirLegenda("Hey! I'm Maya. We can talk about anything, and you can ask me how to say anything. What's on your mind?")).toEqual([
      "Hey!", "I'm Maya.", "We can talk about anything,", "and you can ask me how to say anything.", "What's on your mind?",
    ]);
  });
  it("corta japonês e mandarim na pontuação deles", () => {
    expect(dividirLegenda("こんにちは！元気ですか？")).toEqual(["こんにちは！", "元気ですか？"]);
    expect(dividirLegenda("Ótimo! Agora diga: 你好，我叫小明。")).toEqual(["Ótimo!", "Agora diga:", "你好，我叫小明。"]);
  });
  it("texto vazio", () => {
    expect(dividirLegenda("  ")).toEqual([]);
  });
});

describe("trechoAtual", () => {
  const t = ["Bonjour!", "Comment ça va?", "Très bien."];
  it("avança com o tempo e para no último", () => {
    expect(trechoAtual(t, 0, 14)).toBe(0);
    expect(trechoAtual(t, 1000, 14)).toBe(1);
    expect(trechoAtual(t, 60000, 14)).toBe(2);
    expect(trechoAtual([], 1000, 14)).toBe(-1);
  });
});

describe("calibrarVelocidade", () => {
  it("aproxima da velocidade medida e ignora medidas absurdas", () => {
    expect(calibrarVelocidade(14, 200, 10000)).toBeCloseTo(16.4);
    expect(calibrarVelocidade(14, 200, 1000)).toBe(14);
    expect(calibrarVelocidade(14, 2000, 10000)).toBe(14);
  });
});
