"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Consentimento de cookies (Manual 14.3). Hoje o site usa só cookies essenciais;
 * pixels de marketing e analytics (M18) só podem ser carregados com "aceitar".
 */
export const CHAVE_COOKIES = "papalinguas:cookies:v1";

export default function CookieBanner() {
  const [mostrar, setMostrar] = useState(false);
  useEffect(() => {
    try {
      setMostrar(!localStorage.getItem(CHAVE_COOKIES));
    } catch {
      setMostrar(true);
    }
  }, []);
  if (!mostrar) return null;
  const escolher = (v: "todos" | "essenciais") => {
    try {
      localStorage.setItem(CHAVE_COOKIES, JSON.stringify({ escolha: v, em: new Date().toISOString(), versao: 1 }));
    } catch {}
    setMostrar(false);
  };
  return (
    <div role="dialog" aria-label="Aviso de cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-4 shadow-2xl sm:flex sm:items-center sm:gap-4">
      <p className="text-sm">
        Usamos cookies essenciais para o site funcionar e, com sua permissão, cookies de medição para melhorar o Papalinguas.{" "}
        <Link href="/legal/cookies" className="font-semibold text-brand underline">Saiba mais</Link>
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button className="btn-ghost min-h-11 py-2 text-sm" onClick={() => escolher("essenciais")}>Só essenciais</button>
        <button className="btn-primary min-h-11 py-2 text-sm" onClick={() => escolher("todos")}>Aceitar</button>
      </div>
    </div>
  );
}
