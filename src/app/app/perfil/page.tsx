"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOnboarding } from "@/lib/client/onboarding";
import { LANGUAGES } from "@/lib/domain/types";
import { tutorPorSlug } from "@/lib/demo/data";

/** A8. Perfil e configurações */
export default function Perfil() {
  const { estado, limpar } = useOnboarding();
  const router = useRouter();
  const [excluir, setExcluir] = useState<0 | 1 | 2>(0);
  const tutor = tutorPorSlug(estado.tutorSlug);
  const Item = ({ href, children }: { href?: string; children: React.ReactNode }) =>
    href ? <Link href={href} className="flex min-h-12 items-center justify-between px-4">{children}<span aria-hidden>›</span></Link>
         : <div className="flex min-h-12 items-center justify-between px-4">{children}</div>;

  return (
    <main>
      <h1 className="text-2xl font-extrabold">Perfil</h1>
      <p className="text-ink-soft">{estado.email ?? "conta de demonstração"}</p>
      <ul className="card mt-4 divide-y divide-line p-0">
        <li><Item>Idioma estudado <b>{LANGUAGES[estado.idioma ?? "en"].nome}</b></Item></li>
        <li><Item href="/comecar/tutor">Tutor <b>{tutor.nome}</b></Item></li>
        <li><Item>Meta diária <b>{estado.metaDiaria ?? 10} min</b></Item></li>
        <li><Item href="/app/assinatura">Minha assinatura</Item></li>
      </ul>
      <h2 className="mt-6 font-bold">Privacidade</h2>
      <ul className="card mt-2 divide-y divide-line p-0">
        <li><Item>Baixar meus dados <span className="text-xs text-ink-soft">em breve</span></Item></li>
        <li><Item>Apagar áudios</Item></li>
        <li><button className="flex min-h-12 w-full items-center px-4 font-semibold text-danger" onClick={() => setExcluir(1)}>Excluir conta</button></li>
      </ul>
      {excluir > 0 && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 grid place-items-end bg-black/40 p-4 sm:place-items-center">
          <div className="card w-full max-w-md">
            {excluir === 1 ? (
              <>
                <h2 className="text-xl font-extrabold">Excluir sua conta?</h2>
                <p className="mt-2 text-sm">Sua assinatura será cancelada. Você tem 30 dias para desistir; depois disso, seus dados pessoais e áudios são apagados.</p>
                <div className="mt-4 grid grid-cols-2 gap-2"><button className="btn-ghost" onClick={() => setExcluir(0)}>Voltar</button><button className="btn-accent" onClick={() => setExcluir(2)}>Continuar</button></div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold">Confirmação final</h2>
                <p className="mt-2 text-sm">Tem certeza? Esta ação cancela a assinatura agora.</p>
                <div className="mt-4 grid grid-cols-2 gap-2"><button className="btn-ghost" onClick={() => setExcluir(0)}>Cancelar</button><button className="btn bg-danger text-white" onClick={() => { limpar(); router.push("/"); }}>Excluir conta</button></div>
              </>
            )}
          </div>
        </div>
      )}
      <Link href="/admin" className="mt-8 block text-center text-xs text-ink-soft underline">Painel do administrador</Link>
    </main>
  );
}
