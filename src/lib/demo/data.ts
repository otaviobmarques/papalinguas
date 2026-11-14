import type { Cefr, LangCode } from "@/lib/domain/types";

/** Dados de demonstração espelhando supabase/seed.sql (usados quando o backend não está configurado). */
export interface TutorVisual {
  pele: string;
  cabelo: string;
  estiloCabelo: "curto" | "longo" | "cacheado" | "coque" | "raspado";
  roupa: string;
  oculos?: boolean;
  barba?: boolean;
}
export interface TutorDemo {
  id: string;
  slug: string;
  nome: string;
  idioma: LangCode;
  sotaque: string;
  genero: "feminino" | "masculino";
  estilo: string;
  bio: string;
  saudacao: string;
  visual: TutorVisual;
}

export const TUTORES: TutorDemo[] = [
  { id: "t-maya", slug: "maya", nome: "Maya", idioma: "en", sotaque: "americano", genero: "feminino", estilo: "animada e paciente", bio: "Ama tecnologia e viagens de mochila.", saudacao: "Hi! I'm Maya. Ready to chat?", visual: { pele: "#f1c9a5", cabelo: "#3b2416", estiloCabelo: "longo", roupa: "#e2583e" } },
  { id: "t-oliver", slug: "oliver", nome: "Oliver", idioma: "en", sotaque: "britânico", genero: "masculino", estilo: "calmo e detalhista", bio: "Fã de futebol e de chá preto.", saudacao: "Hello there, I'm Oliver. Shall we begin?", visual: { pele: "#e8b48f", cabelo: "#b5651d", estiloCabelo: "curto", roupa: "#2f5d8a", oculos: true } },
  { id: "t-grace", slug: "grace", nome: "Grace", idioma: "en", sotaque: "americano", genero: "feminino", estilo: "focada em carreira", bio: "Ex-recrutadora, adora simular entrevistas.", saudacao: "Hey, I'm Grace. Let's nail that interview!", visual: { pele: "#7a4a2e", cabelo: "#1a1110", estiloCabelo: "cacheado", roupa: "#6b4fbb" } },
  { id: "t-lucia", slug: "lucia", nome: "Lucía", idioma: "es", sotaque: "mexicano", genero: "feminino", estilo: "divertida e acolhedora", bio: "Cozinheira de mão cheia e fã de música.", saudacao: "¡Hola! Soy Lucía. ¿Platicamos?", visual: { pele: "#c98e63", cabelo: "#20120c", estiloCabelo: "coque", roupa: "#d6336c" } },
  { id: "t-mateo", slug: "mateo", nome: "Mateo", idioma: "es", sotaque: "espanhol", genero: "masculino", estilo: "direto e encorajador", bio: "Ciclista e leitor de quadrinhos.", saudacao: "¡Hola! Soy Mateo. ¡Vamos a hablar!", visual: { pele: "#e0aa82", cabelo: "#2b1d14", estiloCabelo: "curto", roupa: "#0f7a5c", barba: true } },
  { id: "t-bia", slug: "bia", nome: "Bia", idioma: "pt", sotaque: "paulista", genero: "feminino", estilo: "alegre e paciente", bio: "Adora séries e feiras de rua.", saudacao: "Oi! Eu sou a Bia. Vamos conversar?", visual: { pele: "#a86b48", cabelo: "#2a1810", estiloCabelo: "longo", roupa: "#f0a202" } },
  { id: "t-caio", slug: "caio", nome: "Caio", idioma: "pt", sotaque: "carioca", genero: "masculino", estilo: "descontraído", bio: "Surfista e fã de samba.", saudacao: "E aí! Sou o Caio. Bora praticar?", visual: { pele: "#5c3a24", cabelo: "#120b07", estiloCabelo: "raspado", roupa: "#1f8fbf" } },
  { id: "t-helena", slug: "helena", nome: "Helena", idioma: "pt", sotaque: "mineiro", genero: "feminino", estilo: "calma e didática", bio: "Professora de história, ama café.", saudacao: "Olá! Sou a Helena. Vamos com calma, tá?", visual: { pele: "#f3d3b8", cabelo: "#8c8c8c", estiloCabelo: "coque", roupa: "#7a3e2b", oculos: true } },
  { id: "t-camille", slug: "camille", nome: "Camille", idioma: "fr", sotaque: "parisiense", genero: "feminino", estilo: "elegante e paciente", bio: "Ama museus, cafés e cinema francês.", saudacao: "Bonjour ! Je suis Camille. On discute un peu ?", visual: { pele: "#f1d0b5", cabelo: "#4a2c1a", estiloCabelo: "longo", roupa: "#2f4a8a" } },
  { id: "t-julien", slug: "julien", nome: "Julien", idioma: "fr", sotaque: "quebequense", genero: "masculino", estilo: "descontraído e prático", bio: "Morou em Montreal; ajuda quem quer ir ao Canadá.", saudacao: "Salut ! Moi, c'est Julien. On jase ?", visual: { pele: "#e8b896", cabelo: "#6b4a2a", estiloCabelo: "curto", roupa: "#b23a3a", barba: true } },
  { id: "t-giulia", slug: "giulia", nome: "Giulia", idioma: "it", sotaque: "romano", genero: "feminino", estilo: "alegre e expressiva", bio: "Fã de culinária e de história da arte.", saudacao: "Ciao! Sono Giulia. Facciamo due chiacchiere?", visual: { pele: "#e9bf9a", cabelo: "#2a1a10", estiloCabelo: "cacheado", roupa: "#1f8a5b" } },
  { id: "t-marco", slug: "marco", nome: "Marco", idioma: "it", sotaque: "milanês", genero: "masculino", estilo: "calmo e organizado", bio: "Ajuda quem busca cidadania e trabalho na Itália.", saudacao: "Ciao, sono Marco. Cominciamo con calma?", visual: { pele: "#e2b08a", cabelo: "#1e140d", estiloCabelo: "curto", roupa: "#2b2f3a" } },
  { id: "t-lena", slug: "lena", nome: "Lena", idioma: "de", sotaque: "berlinense", genero: "feminino", estilo: "direta e encorajadora", bio: "Engenheira, adora bicicleta e música eletrônica.", saudacao: "Hallo! Ich bin Lena. Wollen wir loslegen?", visual: { pele: "#f4d6c0", cabelo: "#d9b36a", estiloCabelo: "coque", roupa: "#e07a1f" } },
  { id: "t-lukas", slug: "lukas", nome: "Lukas", idioma: "de", sotaque: "muniquense", genero: "masculino", estilo: "paciente e detalhista", bio: "Fã de montanhas; explica a gramática passo a passo.", saudacao: "Servus, ich bin Lukas. Wir machen das Schritt für Schritt.", visual: { pele: "#efc8a8", cabelo: "#8a6a3a", estiloCabelo: "curto", roupa: "#3a6b8a", oculos: true } },
  { id: "t-yuki", slug: "yuki", nome: "Yuki", idioma: "ja", sotaque: "de Tóquio", genero: "feminino", estilo: "gentil e animada", bio: "Adora anime, viagens e comida de rua.", saudacao: "こんにちは！ユキです。いっしょに話しましょう！", visual: { pele: "#f2d2b6", cabelo: "#15100c", estiloCabelo: "longo", roupa: "#d6336c" } },
  { id: "t-kenji", slug: "kenji", nome: "Kenji", idioma: "ja", sotaque: "de Tóquio", genero: "masculino", estilo: "calmo e didático", bio: "Ensina a falar com educação no trabalho e na viagem.", saudacao: "こんにちは、ケンジです。ゆっくり練習しましょう。", visual: { pele: "#e8c4a2", cabelo: "#0f0b08", estiloCabelo: "curto", roupa: "#24384f" } },
  { id: "t-mei", slug: "mei", nome: "Mei", idioma: "zh", sotaque: "de Pequim", genero: "feminino", estilo: "gentil e didática", bio: "Ensina os tons com calma e muita prática.", saudacao: "你好！我是美。我们慢慢来，好吗？", visual: { pele: "#f0d3b8", cabelo: "#120d0a", estiloCabelo: "longo", roupa: "#1f8a8a" } },
  { id: "t-ruby", slug: "ruby", nome: "Ruby", idioma: "en", sotaque: "londrino", genero: "feminino", estilo: "divertida e espirituosa", bio: "Livreira em Londres, ama romances e chá.", saudacao: "Hiya! I'm Ruby. Lovely to meet you!", visual: { pele: "#f3d2bd", cabelo: "#b5441b", estiloCabelo: "longo", roupa: "#d4a017" } },
  { id: "t-sofia", slug: "sofia", nome: "Sofía", idioma: "es", sotaque: "argentino", genero: "feminino", estilo: "calorosa e conversadora", bio: "Portenha, adora cafés, tango e viagens.", saudacao: "¡Hola! Soy Sofía. ¿Cómo andás?", visual: { pele: "#f1d0b5", cabelo: "#d8b56a", estiloCabelo: "longo", roupa: "#1f7a7a" } },
  { id: "t-hao", slug: "hao", nome: "Hao", idioma: "zh", sotaque: "de Xangai", genero: "masculino", estilo: "descontraído, focado em negócios", bio: "Ajuda quem negocia e viaja para a China.", saudacao: "你好，我是浩。我们开始练习吧！", visual: { pele: "#e6c3a0", cabelo: "#0e0a08", estiloCabelo: "curto", roupa: "#7a1f2b" } },
];

export interface CenarioDemo {
  id: string;
  slug: string;
  idioma: LangCode;
  nivel: Cefr;
  unidade: string;
  titulo: string;
  situacao: string;
  missoes: string[];
  vocabulario: { termo: string; traducao: string }[];
  temas: string[];
  objetivos: string[];
  minutos: number;
  fluenteOnly?: boolean;
  emoji: string;
}

export const CENARIOS: CenarioDemo[] = [
  { id: "c1", slug: "en-b1-pedir-aumento", idioma: "en", nivel: "B1", unidade: "Unidade 4: no trabalho", titulo: "Pedir um aumento", situacao: "Você vai pedir um aumento ao seu gerente.", missoes: ["Cumprimentar e pedir um momento", "Citar duas conquistas", "Propor um valor"], vocabulario: [{ termo: "raise", traducao: "aumento" }, { termo: "achievement", traducao: "conquista" }, { termo: "deserve", traducao: "merecer" }, { termo: "budget", traducao: "orçamento" }, { termo: "review", traducao: "avaliação" }], temas: ["negocios"], objetivos: ["carreira"], minutos: 8, emoji: "💼" },
  { id: "c2", slug: "en-b1-entrevista", idioma: "en", nivel: "B1", unidade: "Unidade 4: no trabalho", titulo: "Entrevista de emprego", situacao: "Você está numa entrevista para desenvolvedor.", missoes: ["Apresentar-se", "Falar de um projeto", "Fazer uma pergunta à empresa"], vocabulario: [{ termo: "strength", traducao: "ponto forte" }, { termo: "deadline", traducao: "prazo" }, { termo: "team player", traducao: "bom colega de equipe" }, { termo: "challenge", traducao: "desafio" }, { termo: "hire", traducao: "contratar" }], temas: ["tecnologia", "negocios"], objetivos: ["carreira"], minutos: 10, emoji: "🧑‍💻" },
  { id: "c3", slug: "en-b1-reuniao", idioma: "en", nivel: "B1", unidade: "Unidade 4: no trabalho", titulo: "Reunião rápida", situacao: "Você vai dar uma atualização de status na reunião diária.", missoes: ["Dizer o que fez ontem", "Dizer o que fará hoje", "Citar um bloqueio"], vocabulario: [{ termo: "blocker", traducao: "impedimento" }, { termo: "update", traducao: "atualização" }, { termo: "on track", traducao: "no prazo" }, { termo: "follow up", traducao: "acompanhar" }, { termo: "wrap up", traducao: "finalizar" }], temas: ["negocios", "tecnologia"], objetivos: ["carreira", "conversar"], minutos: 6, emoji: "🗓️" },
  { id: "c4", slug: "en-b2-negociar-contrato", idioma: "en", nivel: "B2", unidade: "Unidade 5: negociações", titulo: "Negociar um contrato", situacao: "Você negocia prazos e valores com um cliente.", missoes: ["Apresentar a proposta", "Responder a uma objeção", "Fechar um acordo"], vocabulario: [{ termo: "leverage", traducao: "vantagem" }, { termo: "terms", traducao: "condições" }, { termo: "counteroffer", traducao: "contraproposta" }, { termo: "agreement", traducao: "acordo" }, { termo: "fair", traducao: "justo" }], temas: ["negocios"], objetivos: ["carreira"], minutos: 12, fluenteOnly: true, emoji: "🤝" },
  { id: "c5", slug: "en-b1-aeroporto", idioma: "en", nivel: "B1", unidade: "Unidade 3: viagem", titulo: "Voo atrasado", situacao: "Seu voo atrasou e você precisa remarcar no balcão.", missoes: ["Explicar o problema", "Pedir uma alternativa", "Confirmar o novo horário"], vocabulario: [{ termo: "delay", traducao: "atraso" }, { termo: "rebook", traducao: "remarcar" }, { termo: "boarding pass", traducao: "cartão de embarque" }, { termo: "layover", traducao: "conexão" }, { termo: "gate", traducao: "portão" }], temas: ["viagem"], objetivos: ["viagem"], minutos: 7, emoji: "✈️" },
];

export const tutorPorSlug = (slug?: string | null) => TUTORES.find((t) => t.slug === slug) ?? TUTORES[0];

/** Uso de demonstração (A1, A9). */
export const USO_DEMO = { cotaMin: 150, usadosMin: 112, limiteDiarioMin: 30, hojeMin: 6, sequenciaDias: 12, cartoesHoje: 8, extraMin: 0 };
