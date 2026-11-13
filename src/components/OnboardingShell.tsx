"use client";
import Link from "next/link";

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
          <Link href={voltar} className="grid size-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Voltar">
            <span aria-hidden className="text-xl">←</span>
          </Link>
        ) : (
          <span className="size-11" />
        )}
        {passo && (
          <div className="flex-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={passo} aria-label={`Passo ${passo} de ${total}`}>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(passo / total) * 100}%` }} />
            </div>
          </div>
        )}
        {passo && <span className="text-sm font-semibold text-ink-soft">{passo}/{total}</span>}
      </header>
      {children}
    </main>
  );
}
