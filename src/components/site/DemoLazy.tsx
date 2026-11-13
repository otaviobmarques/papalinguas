"use client";
import dynamic from "next/dynamic";
import { DEMO_PROPORCAO } from "./demo/proporcao";

/** Carrega o Remotion só no navegador, depois do texto principal (não atrasa a primeira pintura). */
const DemoPlayer = dynamic(() => import("./DemoPlayer"), {
  ssr: false,
  loading: () => <div className="w-full rounded-[2rem] border border-white/10 bg-surface" style={{ aspectRatio: DEMO_PROPORCAO }} aria-hidden />,
});

export default DemoPlayer;
