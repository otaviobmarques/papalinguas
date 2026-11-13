"use client";
import { useEffect, useRef, useState } from "react";
import { estadoInicial, frameDeFFT, proximoVisema, type Visema } from "@/lib/domain/lipsync";

/** Analisa o áudio do tutor (Web Audio, ~60 fps) e devolve o visema atual. */
export function useLipSync(stream: MediaStream | null): { visema: Visema; volume: number } {
  const [saida, setSaida] = useState<{ visema: Visema; volume: number }>({ visema: 0, volume: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!stream) return;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    an.smoothingTimeConstant = 0.5;
    src.connect(an); // não conecta ao destino: o <audio> já toca o som
    const bins = new Uint8Array(an.frequencyBinCount);
    const onda = new Uint8Array(an.fftSize);
    let st = estadoInicial();

    const loop = () => {
      an.getByteFrequencyData(bins);
      an.getByteTimeDomainData(onda);
      let soma = 0;
      for (let i = 0; i < onda.length; i++) {
        const v = (onda[i] - 128) / 128;
        soma += v * v;
      }
      const rms = Math.sqrt(soma / onda.length);
      st = proximoVisema(st, frameDeFFT(bins, ctx.sampleRate, rms));
      setSaida((s) => (s.visema === st.visema && Math.abs(s.volume - rms) < 0.02 ? s : { visema: st.visema, volume: rms }));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf.current);
      src.disconnect();
      ctx.close();
    };
  }, [stream]);

  return saida;
}

/** Volume do microfone do aluno (anel pulsante do botão). */
export function useNivelMicrofone(stream: MediaStream | null): number {
  const { volume } = useLipSync(stream);
  return volume;
}

/** Modo demonstração: visemas a partir do texto (aproximação da "versão 2" do Manual 3.3). */
export function visemaDeLetra(c: string): Visema {
  const l = c.toLowerCase();
  if ("aáàâã".includes(l)) return 1;
  if ("eéêiíy".includes(l)) return 2;
  if ("oóôõ".includes(l)) return 3;
  if ("uúw".includes(l)) return 4;
  if ("mbp".includes(l)) return 5;
  if ("fv".includes(l)) return 6;
  if (" .,!?;:".includes(l)) return 0;
  return 2;
}
