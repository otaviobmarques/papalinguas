import type { CenarioDemo, TutorDemo } from "./data";

/** Roteiros do modo demonstração (sem backend). */
export function roteiroDemo(tutor: TutorDemo, modo: "aula" | "livre" | "nivelamento", cenario?: CenarioDemo | null) {
  const en = tutor.idioma === "en";
  const es = tutor.idioma === "es";
  const t = (a: string, b: string, c: string) => (en ? a : es ? b : c);

  if (modo === "nivelamento") {
    return {
      abertura: t("Hi! I'm " + tutor.nome + ". What's your name, and where are you from?", "¡Hola! Soy " + tutor.nome + ". ¿Cómo te llamas y de dónde eres?", "Oi! Eu sou " + tutor.nome + ". Qual é o seu nome e de onde você é?"),
      respostas: [
        t("Nice! What do you do for work or study?", "¡Qué bien! ¿A qué te dedicas?", "Legal! Você trabalha ou estuda com quê?"),
        t("Tell me about a trip you'd love to take. Why there?", "Cuéntame de un viaje que te gustaría hacer. ¿Por qué ahí?", "Me conta de uma viagem que você gostaria de fazer. Por quê?"),
        t("If you could change one thing about your city, what would it be?", "Si pudieras cambiar algo de tu ciudad, ¿qué sería?", "Se você pudesse mudar algo na sua cidade, o que seria?"),
      ],
      reformular: t("No problem! Let me ask it in a simpler way: do you like music?", "¡Tranquilo! Te pregunto de otra forma: ¿te gusta la música?", "Tudo bem! Vou perguntar de um jeito mais simples: você gosta de música?"),
      despedida: t("Great job! That's all for now.", "¡Muy bien! Eso es todo por ahora.", "Muito bem! Por agora é isso."),
      dica: "",
      traducao: (s: string) => s,
    };
  }

  return {
    abertura: cenario
      ? t(`Hi, come in! You wanted to talk to me?`, `¡Hola, pasa! ¿Querías hablar conmigo?`, `Oi, pode entrar! Você queria falar comigo?`)
      : t(`Hey! I'm ${tutor.nome}. What did you do today?`, `¡Hola! Soy ${tutor.nome}. ¿Qué hiciste hoy?`, `Oi! Eu sou ${tutor.nome}. O que você fez hoje?`),
    respostas: [
      t("Sure, I have a few minutes. What's on your mind?", "Claro, tengo unos minutos. ¿Qué pasa?", "Claro, tenho uns minutinhos. O que houve?"),
      t("That's impressive. Can you give me another example?", "Impresionante. ¿Me das otro ejemplo?", "Que bacana. Você me dá outro exemplo?"),
      t("Okay, and what number did you have in mind?", "Vale, ¿y en qué cifra pensabas?", "Certo, e qual valor você tinha em mente?"),
      t("Let me think about it. Anything else?", "Déjame pensarlo. ¿Algo más?", "Vou pensar nisso. Mais alguma coisa?"),
    ],
    reformular: t("Take your time. Let me ask it differently: how are things going at work?", "Tómate tu tiempo. ¿Cómo te va en el trabajo?", "Sem pressa. Vou perguntar de outro jeito: como vão as coisas no trabalho?"),
    despedida: t("Thanks for today. See you next time!", "Gracias por hoy. ¡Hasta la próxima!", "Obrigado por hoje. Até a próxima!"),
    dica: cenario
      ? t(`Try: "I'd like to talk about my salary." (Eu gostaria de falar sobre meu salário.)`, `Prueba: "Quisiera hablar de mi sueldo." (Eu gostaria de falar sobre meu salário.)`, `Tente: "Eu gostaria de falar sobre meu salário."`)
      : t(`Try: "Today I worked from home." (Hoje eu trabalhei de casa.)`, `Prueba: "Hoy trabajé desde casa." (Hoje trabalhei de casa.)`, `Tente: "Hoje eu trabalhei de casa."`),
    traducao: () => "Modo demonstração: com o tutor real, a última frase aparece traduzida aqui.",
  };
}
