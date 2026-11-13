/** Ícones de traço (24×24, estilo linha) do site e do app. */
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
  inicio: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h5v-6h4v6h5V10" /></>,
  aulas: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
  cartoes: <><rect x="3" y="7" width="13" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /></>,
  progresso: <><path d="M3 20h18" /><path d="m4 15 5-5 4 4 7-8" /><path d="M15 6h5v5" /></>,
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  fogo: <path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.3-4.6.3 1.6 1 2.6 2.2 3C11 8.7 11 5.6 12 3Z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  parar: <rect x="6" y="6" width="12" height="12" rx="2" />,
  micDesligado: <><path d="M15 9.3V6a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 4.9 2.3" /><path d="M19 11a7 7 0 0 1-1.2 3.9M5 11a7 7 0 0 0 10.6 6M12 18v3M3 3l18 18" /></>,
  tartaruga: <><path d="M5 14a7 5 0 0 1 14 0H5Z" /><path d="M19 13h2a1 1 0 0 0 0-2h-1M7 14l-1 3M17 14l1 3M9 9l1.5 5M15 9l-1.5 5" /></>,
  lampada: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" /></>,
  legenda: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 10.5a2 2 0 1 0 0 3M16 10.5a2 2 0 1 0 0 3" /></>,
  sair: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></>,
  busca: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  cadeadoFechado: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  estrela: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
  trofeu: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M16 5h3v2a3 3 0 0 1-3 3M8 5H5v2a3 3 0 0 0 3 3M12 13v4M8 21h8M9 17h6" /></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  voltar: <path d="m15 6-6 6 6 6" />,
  repetir: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></>,
  pacote: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  cartao: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
  semente: <><path d="M12 21v-8" /><path d="M12 13c0-4 3-7 8-7 0 4-3 7-8 7ZM12 13C12 9.5 9.5 7 5 7c0 3.5 2.5 6 7 6Z" /></>,
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
};

export default function Icone({ nome, className = "size-6" }: { nome: keyof typeof P | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {P[nome]}
    </svg>
  );
}
