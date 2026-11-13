"use client";
import { useCallback, useEffect, useState } from "react";
import type { Cefr, LangCode } from "@/lib/domain/types";

/**
 * Progresso do cadastro antes da conta (Telas O5: "o progresso feito antes da conta
 * é salvo e vinculado à conta nova"). Fica no aparelho até o POST /api/onboarding.
 */
export interface OnboardingState {
  passo: string; // última rota visitada, para retomar
  uiLocale: "pt-BR" | "en" | "es";
  idioma?: LangCode;
  objetivo?: "carreira" | "viagem" | "prova" | "morar_fora" | "conversar";
  interesses: string[];
  metaDiaria?: 5 | 10 | 15 | 20;
  aceiteTermos: boolean;
  maioridade: boolean;
  microfone?: "permitido" | "negado";
  email?: string;
  contaCriada: boolean;
  nivel?: Cefr;
  nivelConfianca?: number;
  nivelResumo?: string;
  tutorSlug?: string;
  plano?: { code: "essencial" | "fluente"; periodo: "mensal" | "anual" };
  assinante: boolean;
}

const CHAVE = "papalinguas:onboarding:v1";
const VAZIO: OnboardingState = { passo: "/comecar", uiLocale: "pt-BR", interesses: [], aceiteTermos: false, maioridade: false, contaCriada: false, assinante: false };

function ler(): OnboardingState {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw ? { ...VAZIO, ...JSON.parse(raw) } : VAZIO;
  } catch {
    return VAZIO;
  }
}

export function useOnboarding() {
  const [estado, setEstado] = useState<OnboardingState>(VAZIO);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setEstado(ler());
    setPronto(true);
  }, []);

  const atualizar = useCallback((parcial: Partial<OnboardingState>) => {
    setEstado((atual) => {
      const novo = { ...atual, ...parcial };
      try {
        localStorage.setItem(CHAVE, JSON.stringify(novo));
      } catch {
        /* armazenamento indisponível: segue só em memória */
      }
      return novo;
    });
  }, []);

  const limpar = useCallback(() => {
    try {
      localStorage.removeItem(CHAVE);
    } catch {}
    setEstado(VAZIO);
  }, []);

  return { estado, atualizar, limpar, pronto };
}

/** Envia o cadastro feito antes da conta para POST /api/onboarding (vale para e-mail e login social). */
export async function vincularOnboarding(e: OnboardingState): Promise<boolean> {
  if (!e.idioma || !e.objetivo || !e.metaDiaria) return false;
  const r = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idioma: e.idioma, objetivo: e.objetivo, interesses: e.interesses, metaDiaria: e.metaDiaria, uiLocale: e.uiLocale,
      aceiteTermos: e.aceiteTermos, maioridade: e.maioridade, consentimentoVoz: e.aceiteTermos,
    }),
  }).catch(() => null);
  return Boolean(r?.ok);
}

/** Identificador aleatório do aparelho (antiabuso do teste de nível). Não identifica a pessoa. */
export function idDispositivo(): string {
  const CH = "papalinguas:dispositivo";
  try {
    let id = localStorage.getItem(CH);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CH, id);
    }
    return id;
  } catch {
    return "sem-armazenamento-" + crypto.randomUUID();
  }
}
