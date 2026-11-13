/** Ícones de traço (24×24, estilo linha) do site institucional. */
const P: Record<string, React.ReactNode> = {
  voz: <><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" /><path d="M19 11a7 7 0 0 1-14 0M12 18v3" /></>,
  correcao: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  traduzir: <><path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c0 4-3 7-6 8" /><path d="m13 21 4-9 4 9M14.5 18h5" /></>,
  relatorio: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  revisao: <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></>,
  acolher: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></>,
  carreira: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>,
  viagem: <><path d="M10.5 13.5 3 11l1.5-1.5 7 1 4-4a2.1 2.1 0 0 1 3 3l-4 4 1 7L19 22l-2.5-7.5" /></>,
  prova: <><path d="M9 3h6l1 3H8l1-3Z" /><rect x="5" y="5" width="14" height="16" rx="2" /><path d="m9 13 2 2 4-4" /></>,
  casa: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  conversa: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" /></>,
  escudo: <><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  cadeado: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="M7 4v16l13-8L7 4Z" />,
  som: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
};

export default function Icone({ nome, className = "size-6" }: { nome: keyof typeof P | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {P[nome]}
    </svg>
  );
}
