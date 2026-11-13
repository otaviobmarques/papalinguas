import { describe, expect, it } from "vitest";
import { classificar, estadoInicial, proximoVisema, frameDeFFT } from "@/lib/domain/lipsync";

describe("lip sync", () => {
  it("silêncio é repouso", () => expect(classificar({ rms: 0.01, low: 1, mid: 0, high: 0 }, 0)).toBe(0));
  it("graves fortes são O, fracos são U", () => {
    expect(classificar({ rms: 0.2, low: 0.8, mid: 0.1, high: 0.1 }, 0.2)).toBe(3);
    expect(classificar({ rms: 0.05, low: 0.8, mid: 0.1, high: 0.1 }, 0.05)).toBe(4);
  });
  it("agudos são F/V, médios E/I, equilibrado A", () => {
    expect(classificar({ rms: 0.2, low: 0.1, mid: 0.3, high: 0.6 }, 0.2)).toBe(6);
    expect(classificar({ rms: 0.2, low: 0.2, mid: 0.6, high: 0.2 }, 0.2)).toBe(2);
    expect(classificar({ rms: 0.2, low: 0.4, mid: 0.35, high: 0.25 }, 0.2)).toBe(1);
  });
  it("queda brusca fecha os lábios", () => expect(classificar({ rms: 0.05, low: 0.4, mid: 0.4, high: 0.2 }, 0.2)).toBe(5));
  it("segura o visema por alguns quadros", () => {
    let s = estadoInicial();
    s = proximoVisema(s, { rms: 0.2, low: 0.4, mid: 0.35, high: 0.25 }); // A
    expect(s.visema).toBe(1);
    s = proximoVisema(s, { rms: 0.2, low: 0.2, mid: 0.6, high: 0.2 }); // tentaria E/I
    expect(s.visema).toBe(1);
    s = proximoVisema(s, { rms: 0.01, low: 0, mid: 0, high: 0 }); // silêncio entra na hora
    expect(s.visema).toBe(0);
  });
  it("extrai faixas do FFT", () => {
    const bins = new Uint8Array(1024).fill(0);
    for (let i = 4; i < 30; i++) bins[i] = 255; // ~94–700 Hz em 48 kHz
    const f = frameDeFFT(bins, 48000, 0.2);
    expect(f.low).toBeGreaterThan(0.8);
    expect(f.high).toBe(0);
  });
});
