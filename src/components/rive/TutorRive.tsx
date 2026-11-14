"use client";
import { useEffect } from "react";
import { Alignment, Fit, Layout, RuntimeLoader, useRive, useStateMachineInput } from "@rive-app/react-canvas";
import type { Visema } from "@/lib/domain/lipsync";
import type { EstadoVoz, Expressao } from "@/components/TutorCharacter";
import { RIVE, TUTORES_RIVE } from "@/lib/tutores/rive";

// o motor do Rive é servido pelo próprio app (scripts/copiar-rive-wasm.mjs), sem CDN externo
RuntimeLoader.setWasmUrl("/rive/rive.wasm");

interface Props {
  slug: string;
  nome: string;
  estado?: EstadoVoz;
  visema?: Visema;
  expressao?: Expressao;
  acenando?: boolean;
  className?: string;
  /** "preencher" cobre a área toda (aula); os outros mostram o personagem inteiro */
  enquadramento?: "busto" | "rosto" | "preencher";
}

/**
 * Tutor desenhado no Rive: a boca, os olhos e a cabeça são animados pelo próprio arquivo,
 * comandados pelas mesmas informações que o app já calcula (estado da conversa, visema e expressão).
 * O piscar e a respiração ficam dentro do arquivo .riv.
 */
export default function TutorRive({ slug, nome, estado = "repouso", visema = 0, expressao = "neutra", acenando, className = "", enquadramento = "busto" }: Props) {
  const arquivo = TUTORES_RIVE[slug]?.arquivo;
  const { rive, RiveComponent } = useRive({
    src: arquivo,
    artboard: RIVE.artboard,
    stateMachines: RIVE.maquina,
    autoplay: true,
    layout: new Layout({ fit: enquadramento === "preencher" ? Fit.Cover : Fit.Contain, alignment: enquadramento === "rosto" ? Alignment.TopCenter : Alignment.Center }),
  });
  const iVisema = useStateMachineInput(rive, RIVE.maquina, RIVE.entradas.visema);
  const iEstado = useStateMachineInput(rive, RIVE.maquina, RIVE.entradas.estado);
  const iExpressao = useStateMachineInput(rive, RIVE.maquina, RIVE.entradas.expressao);
  const iAcenar = useStateMachineInput(rive, RIVE.maquina, RIVE.entradas.acenar);

  useEffect(() => {
    if (iVisema) iVisema.value = estado === "falando" ? visema : 0;
  }, [iVisema, visema, estado]);
  useEffect(() => {
    if (iEstado) iEstado.value = RIVE.estados[estado];
  }, [iEstado, estado]);
  useEffect(() => {
    if (iExpressao) iExpressao.value = RIVE.expressoes[expressao];
  }, [iExpressao, expressao]);
  useEffect(() => {
    if (acenando) iAcenar?.fire();
  }, [iAcenar, acenando]);

  return (
    <div className={`relative ${className}`} role="img" aria-label={`${nome}, personagem de IA${estado === "falando" ? ", falando" : ""}`}>
      <RiveComponent className="absolute inset-0 h-full w-full" />
    </div>
  );
}
