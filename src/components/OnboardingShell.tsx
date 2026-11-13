"use client";
import Link from "next/link";
import Icone from "@/components/Icone";

export default function OnboardingShell({
  passo,
  total = 6,
  voltar,
  children,
}: {
  passo?: number;
  total?: number;
  voltar?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-4">
      <header className="mb-6 flex items-center gap-3">
        {voltar ? (
          <Link href={voltar} className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10" aria-label="Voltar">
            <Icone nome="voltar" className="size-5" />
          </Link>
        ) : (
          <span className="size-11" />
        )}
        {passo && (
          <div className="flex-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={passo} aria-label={`Passo ${passo} de ${total}`}>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#5ee29b] shadow-[0_0_12px_rgba(24,169,87,.7)] transition-all duration-500" style={{ width: `${(passo / total) * 100}%` }} />
            </div>
          </div>
        )}
        {passo && <span className="text-sm font-semibold tabular-nums text-ink-soft">{passo}/{total}</span>}
      </header>
      {children}
    </main>
  );
}
