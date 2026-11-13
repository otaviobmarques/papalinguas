"use client";
import { useEffect, useRef, useState } from "react";

/** Liga o brilho que segue o mouse em todos os elementos .holofote da página. */
export function HolofoteGlobal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mover = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".holofote");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => document.removeEventListener("pointermove", mover);
  }, []);
  return null;
}

/** Número que conta até o valor quando aparece na tela. */
export function Contador({ ate, sufixo = "", prefixo = "" }: { ate: number; sufixo?: string; prefixo?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(ate);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setV(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const passo = (t: number) => {
        const p = Math.min(1, (t - t0) / 1200);
        setV(Math.round(ate * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ate]);
  return <span ref={ref}>{prefixo}{v}{sufixo}</span>;
}
