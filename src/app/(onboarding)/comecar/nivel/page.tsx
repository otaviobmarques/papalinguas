"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LiveLesson, { type ResumoAula } from "@/components/LiveLesson";
import TutorCharacter from "@/components/TutorCharacter";
import { idDispositivo, useOnboarding, vincularOnboarding } from "@/lib/client/onboarding";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TUTORES } from "@/lib/demo/data";
import { estimarPorRegra, type ResultadoNivel } from "@/lib/domain/nivel";
import type { Cefr } from "@/lib/domain/types";

/** O6. Teste de nível (conversa de até 3 min, antes do pagamento, uma vez por pessoa) */
export default function TesteNivel() {
  const { estado, atualizar, pronto } = useOnboarding();
  const router = useRouter();
  const [fase, setFase] = useState<"conversa" | "avaliando" | "recusado">("conversa");
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Volta do login social (Google/Apple): vincula o cadastro feito antes da conta
  useEffect(() => {
    if (!pronto || estado.contaCriada) return;
    const sb = supabaseBrowser();
    sb?.auth.getUser().then(async ({ data }) => {
      if (data.user && (await vincularOnboarding(estado))) atualizar({ contaCriada: true, email: data.user.email ?? undefined });
    });
  }, [pronto, estado, atualizar]);

  if (!pronto) return null;
  const tutor = TUTORES.find((t) => t.idioma === (estado.idioma ?? "en")) ?? TUTORES[0];

  function seguir(r: Pick<ResultadoNivel, "nivel" | "confianca" | "consegue">) {
    atualizar({ nivel: r.nivel, nivelConfianca: r.confianca, nivelResumo: r.consegue, passo: "/comecar/tutor" });
    router.push("/comecar/tutor");
  }

  async function concluir(r: ResumoAula | null) {
    setFase("avaliando");
    const corpo = r?.aulaId
      ? { aulaId: r.aulaId, dispositivo: idDispositivo(), falas: r.falas }
      : { pular: true, idioma: estado.idioma ?? "en" };
    const resp = await fetch("/api/nivel/concluir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    }).catch(() => null);
    if (resp?.ok) return seguir(await resp.json());
    // Demonstração (sem conta ou sem backend): estimativa local
    seguir(r ? estimarPorRegra(r.falas.filter((f) => !f.texto.startsWith("("))) : { nivel: "A1", confianca: 1, consegue: "" });
  }

  if (fase === "avaliando") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="size-40"><TutorCharacter visual={tutor.visual} nome={tutor.nome} estado="pensando" className="h-full w-full" /></div>
        <p className="mt-4 font-bold" aria-live="polite">{tutor.nome} está avaliando sua conversa…</p>
      </main>
    );
  }

  if (fase === "recusado") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Teste de nível</h1>
        <p className="mt-2 text-ink-soft">{mensagem}</p>
        <button className="btn-primary mt-6" onClick={() => seguir({ nivel: (estado.nivel ?? "A1") as Cefr, confianca: 0.5, consegue: "" })}>
          Continuar
        </button>
      </main>
    );
  }

  return (
    <LiveLesson
      tutor={tutor}
      modo="nivelamento"
      segundosLimite={180}
      cotaRestanteSeg={180}
      onEncerrar={concluir}
      onRecusa={(d) => {
        if (d.nivel) atualizar({ nivel: d.nivel as Cefr });
        setMensagem(d.mensagem ?? "Não foi possível abrir o teste agora.");
        setFase("recusado");
      }}
      extraTopo={
        <button className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold" onClick={() => concluir(null)}>
          Não sei falar nada ainda
        </button>
      }
    />
  );
}
