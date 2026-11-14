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
    an.smoothingTimeConstant = 0.7;
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

/** Atraso aplicado ao som das amostras para coincidir com a boca (medido no navegador: a boca abre ~60 ms após o som). */
export const ATRASO_SOM_S = 0.06;

/**
 * Lip sync de um <audio> comum (amostras do site e do protótipo). O elemento passa pelo
 * AudioContext uma única vez (exigência do navegador) e continua tocando normalmente.
 */
export function useLipSyncElemento(audio: HTMLAudioElement | null): { visema: Visema; tocando: boolean } {
  const [saida, setSaida] = useState<{ visema: Visema; tocando: boolean }>({ visema: 0, tocando: false });
  useEffect(() => {
    if (!audio) return;
    let ctx: AudioContext | null = null;
    let an: AnalyserNode | null = null;
    let raf = 0;
    let st = estadoInicial();
    const loop = () => {
      if (!an || !ctx) return;
      const bins = new Uint8Array(an.frequencyBinCount);
      const onda = new Uint8Array(an.fftSize);
      an.getByteFrequencyData(bins);
      an.getByteTimeDomainData(onda);
      let soma = 0;
      for (let i = 0; i < onda.length; i++) {
        const v = (onda[i] - 128) / 128;
        soma += v * v;
      }
      st = proximoVisema(st, frameDeFFT(bins, ctx.sampleRate, Math.sqrt(soma / onda.length)));
      setSaida((s) => (s.visema === st.visema && s.tocando ? s : { visema: st.visema, tocando: true }));
      raf = requestAnimationFrame(loop);
    };
    const tocar = () => {
      if (!ctx) {
        ctx = new AudioContext();
        an = ctx.createAnalyser();
        an.fftSize = 1024;
        an.smoothingTimeConstant = 0.7;
        const src = ctx.createMediaElementSource(audio);
        src.connect(an);
        // o som sai um pouco depois do que é analisado: a boca leva ~60 ms para reagir,
        // e assim voz e boca chegam juntas (aqui não há microfone, então atrasar o som é seguro)
        const atraso = ctx.createDelay(0.5);
        atraso.delayTime.value = ATRASO_SOM_S;
        src.connect(atraso);
        atraso.connect(ctx.destination);
      }
      void ctx.resume();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      st = estadoInicial();
      setSaida({ visema: 0, tocando: false });
    };
    audio.addEventListener("play", tocar);
    audio.addEventListener("pause", parar);
    audio.addEventListener("ended", parar);
    return () => {
      audio.removeEventListener("play", tocar);
      audio.removeEventListener("pause", parar);
      audio.removeEventListener("ended", parar);
      cancelAnimationFrame(raf);
      void ctx?.close();
    };
  }, [audio]);
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
