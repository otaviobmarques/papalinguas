import { useId } from "react";
import { simboloSvg } from "@/lib/marca";

/** Símbolo do Papalinguas: o papagaio cuja cabeça é um balão de fala. */
export default function Simbolo({ className = "", titulo }: { className?: string; titulo?: string }) {
  const id = "s" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} role={titulo ? "img" : undefined} aria-label={titulo} aria-hidden={titulo ? undefined : true}
      dangerouslySetInnerHTML={{ __html: simboloSvg(id) }} />
  );
}
