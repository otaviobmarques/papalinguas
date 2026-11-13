import Simbolo from "./Simbolo";

/** Logo completa: símbolo + "papalinguas" (+ assinatura opcional). */
export default function Logo({ className = "", assinatura = false, tamanho = "md" }: { className?: string; assinatura?: boolean; tamanho?: "sm" | "md" | "lg" }) {
  const s = { sm: ["size-8", "text-lg"], md: ["size-10", "text-xl"], lg: ["size-14", "text-3xl"] }[tamanho];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Simbolo className={`${s[0]} shrink-0`} />
      <span className="flex flex-col leading-none">
        <span className={`${s[1]} font-extrabold tracking-[-0.03em]`}>papalinguas</span>
        {assinatura && <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.32em] opacity-60">tutores de IA</span>}
      </span>
    </span>
  );
}
