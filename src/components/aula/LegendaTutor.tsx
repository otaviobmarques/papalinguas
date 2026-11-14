"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { calibrarVelocidade, dividirLegenda, trechoAtual } from "@/lib/domain/legenda";

interface Props {
  texto: string;
  falando: boolean;
  devagar: boolean;
}

/**
 * Legenda do tutor: enquanto ele fala, um trecho curto por vez, no ritmo da voz;
 * quando ele termina, a frase inteira fica na tela para o aluno reler.
 * A velocidade se ajusta sozinha a cada fala (o tempo real de cada resposta calibra a próxima).
 */
export default function LegendaTutor({ texto, falando, devagar }: Props) {
  const trechos = useMemo(() => dividirLegenda(texto), [texto]);
  const cps = useRef({ normal: 14, devagar: 11 });
  const textoAtual = useRef(texto);
  textoAtual.current = texto;
  const [tempo, setTempo] = useState<{ inicio: number; agora: number } | null>(null);

  useEffect(() => {
    if (!falando) return;
    const t0 = performance.now();
    const velocidade = cps.current;
    setTempo({ inicio: t0, agora: t0 });
    const id = setInterval(() => setTempo({ inicio: t0, agora: performance.now() }), 100);
    return () => {
      clearInterval(id);
      const chave = devagar ? "devagar" : "normal";
      velocidade[chave] = calibrarVelocidade(velocidade[chave], textoAtual.current.length, performance.now() - t0);
      setTempo(null);
    };
  }, [falando, devagar]);

  if (!texto) return null;

  if (!falando || !tempo) {
    return (
      <p className="anim-legenda max-h-32 overflow-y-auto rounded-2xl bg-[#0b1220]/80 px-4 py-3 text-base font-semibold leading-snug backdrop-blur">
        {texto}
      </p>
    );
  }

  const i = trechoAtual(trechos, tempo.agora - tempo.inicio, cps.current[devagar ? "devagar" : "normal"]);
  if (i < 0) return null;
  return (
    <div className="flex justify-center" aria-hidden>
      <p key={i} className="anim-legenda w-fit max-w-full rounded-2xl bg-[#0b1220]/85 px-4 py-2.5 text-center text-lg font-extrabold leading-snug shadow-lg backdrop-blur">
        {trechos[i]}
      </p>
    </div>
  );
}
