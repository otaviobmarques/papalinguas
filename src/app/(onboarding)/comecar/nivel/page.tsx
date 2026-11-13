"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import LiveLesson, { type ResumoAula } from "@/components/LiveLesson";
import { useOnboarding, vincularOnboarding } from "@/lib/client/onboarding";
import { TUTORES } from "@/lib/demo/data";
import type { Cefr } from "@/lib/domain/types";

/** O6. Teste de nível (conversa de até 3 min, antes do pagamento, uma vez por pessoa) */
export default function TesteNivel() {
  const { estado, atualizar, pronto } = useOnboarding();
  const router = useRouter();

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

  function concluir(r: ResumoAula | null) {
    // TODO(sprint 4): POST /api/nivel/concluir avalia a transcrição com o modelo de texto.
    // Demonstração: estimativa simples pela quantidade de falas.
    const falasAluno = r?.falas.filter((f) => f.quem === "aluno").length ?? 0;
    const nivel: Cefr = !r ? "A1" : falasAluno >= 3 ? "B1" : falasAluno >= 1 ? "A2" : "A1";
    atualizar({ nivel, nivelConfianca: !r ? 1 : falasAluno >= 3 ? 0.7 : 0.4, passo: "/comecar/tutor" });
    router.push("/comecar/tutor");
  }

  return (
    <LiveLesson
      tutor={tutor}
      modo="nivelamento"
      segundosLimite={180}
      cotaRestanteSeg={180}
      onEncerrar={concluir}
      extraTopo={
        <button className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold" onClick={() => concluir(null)}>
          Não sei falar nada ainda
        </button>
      }
    />
  );
}
