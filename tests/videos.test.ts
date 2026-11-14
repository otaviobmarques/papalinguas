import { describe, expect, it } from "vitest";
import { mostrarFalando } from "@/lib/tutores/videos";

describe("vídeo falando/ouvindo", () => {
  it("mostra o vídeo falando enquanto a voz sai", () => {
    expect(mostrarFalando(true, 1000, 1100)).toBe(true);
  });
  it("pausa curta entre palavras não troca o vídeo", () => {
    expect(mostrarFalando(true, 1000, 1400)).toBe(true);
  });
  it("pausa de verdade volta ao vídeo ouvindo", () => {
    expect(mostrarFalando(true, 1000, 1600)).toBe(false);
  });
  it("fora da fala nunca mostra o vídeo falando", () => {
    expect(mostrarFalando(false, 1000, 1000)).toBe(false);
    expect(mostrarFalando(true, null, 1000)).toBe(false);
  });
});
