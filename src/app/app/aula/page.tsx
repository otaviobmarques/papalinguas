"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LiveLesson, { type ResumoAula } from "@/components/LiveLesson";
import { useOnboarding } from "@/lib/client/onboarding";
import { CENARIOS, USO_DEMO, tutorPorSlug } from "@/lib/demo/data";

/** A3. Aula ao vivo */
function Aula() {
  const { estado, pronto } = useOnboarding();
  const router = useRouter();
  const slug = useSearchParams().get("cenario");
  if (!pronto) return null;
  const tutor = tutorPorSlug(estado.tutorSlug);
  const cenario = CENARIOS.find((c) => c.slug === slug) ?? null;

  function fim(r: ResumoAula) {
    try {
      sessionStorage.setItem("papalinguas:ultima-aula", JSON.stringify({ ...r, cenario: cenario?.slug ?? null }));
    } catch {}
    router.replace("/app/relatorio");
  }

  return (
    <LiveLesson
      tutor={tutor}
      modo={cenario ? "aula" : "livre"}
      cenario={cenario}
      segundosLimite={20 * 60}
      cotaRestanteSeg={(USO_DEMO.cotaMin - USO_DEMO.usadosMin) * 60}
      onEncerrar={fim}
    />
  );
}

export default function Page() {
  return <Suspense><Aula /></Suspense>;
}
