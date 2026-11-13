"use client";
import { useEffect, useMemo, useState } from "react";
import { CENARIOS, USO_DEMO, type CenarioDemo } from "@/lib/demo/data";
import type { OnboardingState } from "./onboarding";

/** Dados reais do aluno (GET /api/me). null = visitante / modo demonstração. */
export interface Aluno {
  nome: string;
  email: string;
  perfil: { idioma: "en" | "es" | "pt"; nivel: string | null; confiancaNivel: number | null; nivelTestadoEm: string | null; objetivo: string | null; interesses: string[]; metaDiariaMin: number; tutorSlug: string | null } | null;
  idiomas: string[];
  assinatura: { status: string; ativa: boolean; gateway: string; metodo: string | null; renovaEm: string | null; cancelaNoFim: boolean; emGarantia: boolean;
    plano: { codigo: string; nome: string; periodo: string | null; precoCentavos: number } | null } | null;
  cota: { totalMin: number; usadosMin: number; restanteSeg: number; extraMin: number; renovaEm: string | null; limiteDiarioMin: number };
  hoje: { minutos: number };
  sequenciaDias: number;
  minutosPorSemana: number[];
  aulasConcluidas: number;
  ultimaAula: { cenarioSlug: string | null; titulo: string } | null;
  cartoesHoje: number;
  conquistas: string[];
}

type Estado = { carregando: true; aluno: null; demo: false } | { carregando: false; aluno: Aluno; demo: false } | { carregando: false; aluno: null; demo: true };

let cache: Promise<Aluno | null> | null = null;
function buscar(): Promise<Aluno | null> {
  cache ??= fetch("/api/me", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Aluno>) : null))
    .catch(() => null);
  return cache;
}
/** Depois de ações que mudam os dados (aula, assinatura), descarta o cache. */
export const recarregarAluno = () => { cache = null; };

export function useAluno(): Estado {
  const [e, setE] = useState<Estado>({ carregando: true, aluno: null, demo: false });
  useEffect(() => {
    let vivo = true;
    buscar().then((a) => vivo && setE(a ? { carregando: false, aluno: a, demo: false } : { carregando: false, aluno: null, demo: true }));
    return () => { vivo = false; };
  }, []);
  return e;
}

let cacheCen: Promise<CenarioDemo[] | null> | null = null;
/** Cenários do banco (GET /api/cenarios); sem backend, os de demonstração. */
export function useCenarios(idioma?: string): CenarioDemo[] | null {
  const [lista, setLista] = useState<CenarioDemo[] | null>(null);
  useEffect(() => {
    cacheCen ??= fetch("/api/cenarios").then((r) => (r.ok ? r.json().then((d) => d.cenarios.map((c: CenarioDemo) => ({ ...c, emoji: emojiDe(c) }))) : null)).catch(() => null);
    let vivo = true;
    cacheCen.then((c) => vivo && setLista(c ?? CENARIOS));
    return () => { vivo = false; };
  }, []);
  return useMemo(() => (lista && idioma ? lista.filter((c) => c.idioma === idioma) : lista), [lista, idioma]);
}

function emojiDe(c: { temas?: string[]; objetivos?: string[] }): string {
  const t = [...(c.temas ?? []), ...(c.objetivos ?? [])];
  if (t.includes("viagem")) return "✈️";
  if (t.includes("tecnologia")) return "🧑‍💻";
  if (t.includes("negocios") || t.includes("carreira")) return "💼";
  return "💬";
}

/** Valores que as telas exibem: reais quando há aluno, de demonstração quando não. */
export function resumoTela(aluno: Aluno | null, onb: OnboardingState) {
  if (aluno) {
    return {
      nome: aluno.nome,
      idioma: aluno.perfil?.idioma ?? onb.idioma ?? "en",
      nivel: aluno.perfil?.nivel ?? onb.nivel ?? "A1",
      tutorSlug: aluno.perfil?.tutorSlug ?? onb.tutorSlug ?? null,
      objetivo: aluno.perfil?.objetivo ?? onb.objetivo ?? "conversar",
      metaDiaria: aluno.perfil?.metaDiariaMin ?? onb.metaDiaria ?? 10,
      hojeMin: aluno.hoje.minutos,
      sequencia: aluno.sequenciaDias,
      cotaTotal: aluno.cota.totalMin,
      cotaUsada: aluno.cota.usadosMin,
      restanteMin: Math.floor(aluno.cota.restanteSeg / 60),
      restanteSeg: aluno.cota.restanteSeg,
      limiteDiario: aluno.cota.limiteDiarioMin,
      cartoes: aluno.cartoesHoje,
      assinante: !!aluno.assinatura?.ativa,
    };
  }
  return {
    nome: onb.email?.split("@")[0] ?? "",
    idioma: onb.idioma ?? "en",
    nivel: onb.nivel ?? "B1",
    tutorSlug: onb.tutorSlug ?? null,
    objetivo: onb.objetivo ?? "carreira",
    metaDiaria: onb.metaDiaria ?? 10,
    hojeMin: USO_DEMO.hojeMin,
    sequencia: USO_DEMO.sequenciaDias,
    cotaTotal: USO_DEMO.cotaMin,
    cotaUsada: USO_DEMO.usadosMin,
    restanteMin: USO_DEMO.cotaMin - USO_DEMO.usadosMin + USO_DEMO.extraMin,
    restanteSeg: (USO_DEMO.cotaMin - USO_DEMO.usadosMin) * 60,
    limiteDiario: USO_DEMO.limiteDiarioMin,
    cartoes: USO_DEMO.cartoesHoje,
    assinante: true,
  };
}
