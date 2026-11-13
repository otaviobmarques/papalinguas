import { describe, expect, it } from "vitest";
import { classificar, estadoInicial, proximoVisema, frameDeFFT } from "@/lib/domain/lipsync";

describe("lip sync", () => {
  // Faixas no formato real do AnalyserNode (dB em bytes): graves ~0,5, médios ~0,3, agudos ~0,17 do total
  it("silêncio é repouso", () => expect(classificar({ rms: 0.008, low: 0.5, mid: 0.3, high: 0.2 }, 0)).toBe(0));
  it("som abafado forte é O, fraco é U", () => {
    expect(classificar({ rms: 0.08, low: 0.62, mid: 0.25, high: 0.13 }, 0.08)).toBe(3);
    expect(classificar({ rms: 0.025, low: 0.62, mid: 0.25, high: 0.13 }, 0.025)).toBe(4);
  });
  it("chiado é F/V, médios E/I, equilibrado e forte A", () => {
    expect(classificar({ rms: 0.06, low: 0.4, mid: 0.3, high: 0.3 }, 0.06)).toBe(6);
    expect(classificar({ rms: 0.06, low: 0.45, mid: 0.38, high: 0.17 }, 0.06)).toBe(2);
    expect(classificar({ rms: 0.06, low: 0.52, mid: 0.3, high: 0.18 }, 0.06)).toBe(1);
    expect(classificar({ rms: 0.02, low: 0.52, mid: 0.3, high: 0.18 }, 0.02)).toBe(2); // vogal fraca: boca entreaberta
  });
  it("queda brusca fecha os lábios", () => expect(classificar({ rms: 0.03, low: 0.5, mid: 0.3, high: 0.2 }, 0.09)).toBe(5));
  it("segura cada posição ~115 ms e só fecha depois de ~100 ms de silêncio", () => {
    const A = { rms: 0.06, low: 0.52, mid: 0.3, high: 0.18 };
    const EI = { rms: 0.06, low: 0.45, mid: 0.38, high: 0.17 };
    const mudo = { rms: 0.005, low: 0, mid: 0, high: 0 };
    let s = proximoVisema(estadoInicial(), A);
    expect(s.visema).toBe(1); // sai do repouso na hora
    for (let i = 0; i < 6; i++) s = proximoVisema(s, EI);
    expect(s.visema).toBe(1); // ainda segurando o A
    s = proximoVisema(s, EI);
    expect(s.visema).toBe(2); // depois de 7 quadros, troca
    for (let i = 0; i < 5; i++) s = proximoVisema(s, mudo);
    expect(s.visema).toBe(2); // pausa curta entre sílabas não fecha a boca
    s = proximoVisema(s, mudo);
    expect(s.visema).toBe(0); // silêncio de verdade fecha
  });
  it("extrai faixas do FFT", () => {
    const bins = new Uint8Array(1024).fill(0);
    for (let i = 4; i < 30; i++) bins[i] = 255; // ~94–700 Hz em 48 kHz
    const f = frameDeFFT(bins, 48000, 0.2);
    expect(f.low).toBeGreaterThan(0.8);
    expect(f.high).toBe(0);
  });
});
