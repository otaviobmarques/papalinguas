/** Dados públicos do site institucional (SEO, rodapé, dados estruturados). */
export const SITE = {
  nome: "Papalinguas",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://papalinguas.com.br").replace(/\/$/, ""),
  titulo: "Papalinguas: fale inglês, espanhol, francês, italiano, alemão ou japonês com um tutor de IA",
  descricao:
    "Converse por voz com um tutor de IA, receba correções gentis, relatório de pronúncia e revisão do que você errou. Inglês, espanhol, francês, italiano, alemão, japonês e português para estrangeiros. Faça o teste de nível grátis.",
  empresa: "Domma Tecnologia e Desenvolvimento de Software",
  cnpj: "70.075.405/0001-74",
  contato: "contato@papalinguas.com.br",
};
