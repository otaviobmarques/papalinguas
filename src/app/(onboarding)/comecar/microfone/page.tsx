"use client";
import Icone from "@/components/Icone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OnboardingShell from "@/components/OnboardingShell";
import { useOnboarding, vincularOnboarding } from "@/lib/client/onboarding";

/** O4. Microfone e privacidade (LGPD; MVP só 18+) */
export default function Microfone() {
  const { estado, atualizar } = useOnboarding();
  const router = useRouter();
  const [negado, setNegado] = useState(false);
  const pode = estado.aceiteTermos && estado.maioridade;

  // Já logado (ex.: entrou por "Já tenho conta"): grava o cadastro e segue para o teste de nível
  async function seguir(microfone: "permitido" | "negado") {
    if (estado.contaCriada) {
      await vincularOnboarding({ ...estado, microfone });
      atualizar({ microfone, passo: "/comecar/nivel" });
      router.push("/comecar/nivel");
      return;
    }
    atualizar({ microfone, passo: "/comecar/conta" });
    router.push("/comecar/conta");
  }

  async function permitir() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      await seguir("permitido");
    } catch {
      atualizar({ microfone: "negado" });
      setNegado(true);
    }
  }

  return (
    <OnboardingShell passo={3} voltar="/comecar/objetivo">
      <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-brand/15 text-[#5ee29b] shadow-[0_0_50px_rgba(24,169,87,.4)]" aria-hidden><Icone nome="mic" className="size-9" /></div>
      <h1 className="text-center text-2xl font-extrabold">Vamos conversar por voz</h1>
      <p className="mt-2 text-center text-ink-soft">
        O app usa o microfone para você conversar com o tutor e para avaliar sua pronúncia.
      </p>

      <ul className="card mt-6 space-y-3 text-sm">
        <li className="flex gap-3"><Icone nome="relatorio" className="size-5 shrink-0 text-[#5ee29b]" /><span><b>Guardamos a transcrição</b> das aulas para seus relatórios e revisão.</span></li>
        <li className="flex gap-3"><Icone nome="relogio" className="size-5 shrink-0 text-[#5ee29b]" /><span><b>O áudio bruto é apagado em 30 dias.</b> Você pode apagar o histórico quando quiser.</span></li>
        <li className="flex gap-3"><Icone nome="escudo" className="size-5 shrink-0 text-[#5ee29b]" /><span>Seu tutor é uma inteligência artificial, não uma pessoa.</span></li>
      </ul>

      <div className="mt-6 space-y-3">
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 size-5 accent-[var(--brand)]" checked={estado.aceiteTermos} onChange={(e) => atualizar({ aceiteTermos: e.target.checked })} />
          <span>Li e aceito os <Link className="font-semibold text-brand underline" href="/legal/termos">Termos de Uso</Link> e a <Link className="font-semibold text-brand underline" href="/legal/privacidade">Política de Privacidade</Link>, incluindo o uso da minha voz para ensino e avaliação de pronúncia.</span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 size-5 accent-[var(--brand)]" checked={estado.maioridade} onChange={(e) => atualizar({ maioridade: e.target.checked })} />
          <span>Tenho 18 anos ou mais.</span>
        </label>
      </div>

      {negado && (
        <div role="alert" className="mt-4 rounded-2xl bg-warn-soft p-4 text-sm">
          <p className="font-bold text-warn">O microfone foi bloqueado.</p>
          <p className="mt-1">Para liberar, toque no cadeado ao lado do endereço do site e permita o microfone. Enquanto isso, você pode seguir em modo texto.</p>
          <button className="btn-ghost mt-3 w-full" onClick={() => seguir("negado")}>Continuar em modo texto</button>
        </div>
      )}

      <div className="mt-auto pt-8">
        <button className="btn-primary w-full" disabled={!pode} onClick={permitir}>Permitir microfone</button>
      </div>
    </OnboardingShell>
  );
}
