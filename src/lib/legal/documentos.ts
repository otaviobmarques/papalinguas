import { SITE } from "@/lib/site";

/**
 * MINUTAS dos documentos legais (Manual 14). Escritas a partir do Manual Técnico v2.2;
 * precisam de revisão e aprovação jurídica antes de valer. NÃO assinar em nome de
 * advogado(a) sem a revisão dele(a).
 */
export interface Secao { titulo: string; paragrafos: string[] }
export interface Documento { titulo: string; resumo: string; versao: string; secoes: Secao[] }

const EMPRESA = `${SITE.empresa}, inscrita no CNPJ ${SITE.cnpj}`;
const CONTATO = SITE.contato;
const VERSAO = "Minuta de 13/11/2026";

export const DOCUMENTOS: Record<string, Documento> = {
  termos: {
    titulo: "Termos de Uso",
    resumo: "As regras para usar o Papalinguas: quem pode usar, como funcionam a assinatura, os minutos de conversa e os tutores de IA.",
    versao: VERSAO,
    secoes: [
      { titulo: "1. Quem somos", paragrafos: [
        `O Papalinguas é um serviço de prática de idiomas por conversa com tutores de inteligência artificial, oferecido por ${EMPRESA} ("Papalinguas", "nós").`,
        "Ao criar uma conta ou usar o serviço, você concorda com estes Termos e com a Política de Privacidade.",
      ] },
      { titulo: "2. Quem pode usar", paragrafos: [
        "O serviço é destinado exclusivamente a pessoas com 18 anos ou mais. Ao se cadastrar, você confirma ter 18 anos ou mais.",
        "Você é responsável pelas informações que fornece e por manter o acesso à sua conta (e-mail ou login social) protegido.",
      ] },
      { titulo: "3. O que é o serviço", paragrafos: [
        "Os tutores são inteligências artificiais com personagens ilustrados. Eles não são pessoas, não são professores humanos e podem cometer erros. O conteúdo das conversas tem finalidade exclusivamente educacional.",
        "O serviço inclui conversas por voz, avaliação de pronúncia, relatórios pós-aula e revisão espaçada, conforme o plano contratado.",
        "Os tutores não oferecem aconselhamento médico, jurídico, financeiro ou psicológico.",
      ] },
      { titulo: "4. Teste de nível gratuito", paragrafos: [
        "Antes da assinatura, oferecemos um teste de nível por conversa de até 3 minutos, uma vez por pessoa. Para evitar abusos, limitamos o teste por conta e por dispositivo. O teste pode ser desativado a qualquer momento.",
      ] },
      { titulo: "5. Planos, minutos e limites", paragrafos: [
        "Não há plano gratuito. Os planos pagos incluem uma quantidade de minutos de conversa por ciclo e um limite diário, informados antes da contratação. Minutos não usados no ciclo não acumulam para o ciclo seguinte.",
        "O pacote extra de minutos tem validade própria, informada na compra, e é usado depois dos minutos do ciclo.",
        "Para proteger o serviço, podemos limitar o número e a duração das aulas por dia.",
      ] },
      { titulo: "6. Pagamento e renovação", paragrafos: [
        "As assinaturas são cobradas antecipadamente, por Pix ou cartão, por meio de processadores de pagamento parceiros. Os dados do cartão são informados diretamente na página segura do processador e não passam pelos nossos servidores.",
        "A assinatura renova automaticamente ao fim de cada período, até que você cancele. Os preços vigentes são exibidos antes da contratação; mudanças de preço não afetam o período já pago.",
        "Emitimos nota fiscal de serviço para cada cobrança paga. Para isso, solicitamos seu CPF.",
      ] },
      { titulo: "7. Garantia, arrependimento e cancelamento", paragrafos: [
        "Na primeira contratação, você pode desistir em até 7 dias corridos e receber a devolução integral do valor pago (art. 49 do Código de Defesa do Consumidor). Os detalhes estão na Política de Reembolso e Cancelamento.",
        "Você pode cancelar a renovação a qualquer momento, em poucos toques, mantendo o acesso até o fim do período já pago.",
      ] },
      { titulo: "8. Uso aceitável", paragrafos: [
        "É proibido usar o serviço para conteúdo ilegal, sexual, violento, discriminatório ou de assédio; tentar alterar o comportamento dos tutores para fins indevidos; automatizar o uso; revender o acesso; ou criar várias contas para obter benefícios gratuitos.",
        "Podemos suspender ou encerrar contas que violem estas regras, com registro do motivo.",
      ] },
      { titulo: "9. Propriedade intelectual", paragrafos: [
        "A marca Papalinguas, os personagens dos tutores, o conteúdo das aulas e o software pertencem ao Papalinguas ou a seus licenciadores. Você recebe uma licença pessoal, não exclusiva e intransferível para usar o serviço enquanto sua conta estiver ativa.",
      ] },
      { titulo: "10. Disponibilidade e limitação de responsabilidade", paragrafos: [
        "Trabalhamos para manter o serviço disponível, mas ele pode passar por interrupções, manutenções ou falhas de fornecedores. O serviço não garante aprovação em provas, contratações ou certificações.",
      ] },
      { titulo: "11. Alterações e contato", paragrafos: [
        "Podemos atualizar estes Termos. Mudanças relevantes serão avisadas no app ou por e-mail, e a versão aceita fica registrada na sua conta.",
        `Dúvidas: ${CONTATO}. Foro: o do domicílio do consumidor, na forma da lei.`,
      ] },
    ],
  },

  privacidade: {
    titulo: "Política de Privacidade",
    resumo: "Quais dados tratamos, por que, com quem compartilhamos, por quanto tempo guardamos e como você exerce seus direitos (LGPD).",
    versao: VERSAO,
    secoes: [
      { titulo: "1. Controlador", paragrafos: [
        `O controlador dos dados é ${EMPRESA}. Encarregado de proteção de dados (DPO): a ser nomeado; contato provisório: ${CONTATO}.`,
      ] },
      { titulo: "2. Dados que tratamos", paragrafos: [
        "Cadastro: nome, e-mail, idioma da interface, país, confirmação de maioridade e registros de aceite dos termos (versão, data e IP).",
        "Aprendizagem: idioma estudado, objetivo, interesses, meta diária, nível, tutor escolhido e preferências do Modo Acolher. O Modo Acolher pergunta preferências de aprendizagem e nunca diagnósticos de saúde.",
        "Voz e conversas: áudio das aulas, transcrições, notas de pronúncia e fatos que você conta ao tutor para personalizar as aulas.",
        "Pagamento: CPF, plano, histórico de cobranças e notas fiscais. Não armazenamos dados de cartão.",
        "Uso e dispositivo: identificador aleatório do aparelho (para o limite do teste gratuito), registros técnicos e, com seu consentimento, dados de medição de uso.",
      ] },
      { titulo: "3. Para que usamos", paragrafos: [
        "Prestar o serviço (conversas, avaliação de pronúncia, relatórios, revisão), cobrar e emitir nota fiscal, prevenir fraude e abuso, dar suporte, cumprir obrigações legais e, com consentimento, enviar comunicações de marketing e medir campanhas.",
        "Bases legais (LGPD, art. 7º): execução de contrato, cumprimento de obrigação legal, legítimo interesse (segurança e prevenção de fraude) e consentimento (voz para fins educacionais, marketing e cookies não essenciais).",
      ] },
      { titulo: "4. Sua voz", paragrafos: [
        "Sua voz é usada apenas para a conversa com o tutor e a avaliação de pronúncia. O áudio bruto é apagado automaticamente em até 30 dias. As transcrições ficam enquanto sua conta existir, para relatórios e revisão, e você pode apagá-las.",
      ] },
      { titulo: "5. Com quem compartilhamos (operadores)", paragrafos: [
        "Fornecedores que processam dados em nosso nome, com contrato: OpenAI (conversa por voz e textos), Microsoft Azure (pronúncia), Anthropic (textos, como contingência), Supabase (banco de dados e login), Vercel (hospedagem), Resend (e-mails) e processadores de pagamento (Asaas; futuramente Mercado Pago e Stripe).",
        "Sempre que a opção existir, contratamos para que os dados não sejam usados para treinar modelos de IA.",
        "Não vendemos seus dados.",
      ] },
      { titulo: "6. Transferência internacional", paragrafos: [
        "Alguns fornecedores ficam fora do Brasil. Nesses casos, adotamos as salvaguardas previstas na LGPD (art. 33), como cláusulas contratuais.",
      ] },
      { titulo: "7. Por quanto tempo guardamos", paragrafos: [
        "Áudio bruto: até 30 dias. Dados da conta e transcrições: enquanto a conta estiver ativa. Após pedido de exclusão, há um prazo de 30 dias para desistência; depois, os dados pessoais são apagados ou anonimizados. Dados fiscais e de pagamento são mantidos pelo prazo exigido pela legislação.",
      ] },
      { titulo: "8. Seus direitos", paragrafos: [
        "Você pode confirmar o tratamento, acessar, corrigir, baixar (portabilidade) e excluir seus dados, revogar consentimentos e pedir informações sobre compartilhamento (LGPD, art. 18), pelo próprio app (Perfil → Privacidade) ou pelo e-mail do encarregado.",
      ] },
      { titulo: "9. Crianças e adolescentes", paragrafos: [
        "O serviço é exclusivo para maiores de 18 anos. Se identificarmos conta de menor, ela será encerrada e os dados excluídos.",
      ] },
      { titulo: "10. Segurança", paragrafos: [
        "Usamos criptografia em trânsito, controle de acesso por linha no banco de dados, credenciais temporárias para os serviços de voz, chaves de integração cifradas, autenticação reforçada para a equipe e registro de auditoria das ações administrativas.",
      ] },
      { titulo: "11. Alterações", paragrafos: ["Mudanças relevantes nesta política serão avisadas no app ou por e-mail."] },
    ],
  },

  cookies: {
    titulo: "Política de Cookies",
    resumo: "Quais cookies e armazenamentos locais usamos no site e no app, e como escolher.",
    versao: VERSAO,
    secoes: [
      { titulo: "1. O que são", paragrafos: ["Cookies e armazenamento local são pequenos dados guardados no seu navegador para o site funcionar, lembrar suas escolhas e, com sua permissão, medir o uso."] },
      { titulo: "2. Essenciais (sempre ativos)", paragrafos: [
        "Sessão de login, segurança, progresso do cadastro inicial, identificador aleatório do aparelho (limite do teste gratuito) e a sua escolha sobre cookies. Sem eles, o serviço não funciona.",
      ] },
      { titulo: "3. Medição e marketing (só com sua permissão)", paragrafos: [
        "Quando ativados, podemos usar ferramentas de análise de uso (como PostHog) e de medição de anúncios (como Meta e Google) para entender o que funciona e melhorar o serviço. Elas só são carregadas se você clicar em \"Aceitar\".",
      ] },
      { titulo: "4. Como mudar sua escolha", paragrafos: ["Você pode apagar os dados do site no seu navegador a qualquer momento; o aviso de cookies aparecerá de novo."] },
    ],
  },

  reembolso: {
    titulo: "Política de Reembolso e Cancelamento",
    resumo: "Garantia de 7 dias, cancelamento a qualquer momento e como funcionam os reembolsos.",
    versao: VERSAO,
    secoes: [
      { titulo: "1. Garantia de 7 dias (direito de arrependimento)", paragrafos: [
        "Na primeira assinatura, você pode desistir em até 7 dias corridos a contar da contratação e receber o valor integral pago (art. 49 do Código de Defesa do Consumidor).",
        "O pedido é feito em Minha assinatura → \"Desistir e receber reembolso\". O valor volta pelo mesmo meio de pagamento, e a nota fiscal é cancelada.",
        "A garantia vale uma vez por pessoa. Para evitar abuso, verificamos CPF, e-mail, dispositivo e cartão.",
      ] },
      { titulo: "2. Cancelamento da renovação", paragrafos: [
        "Você pode cancelar a qualquer momento, em no máximo 2 toques, sem perguntas obrigatórias. O acesso continua até o fim do período já pago, e não há nova cobrança.",
      ] },
      { titulo: "3. Pacote extra de minutos", paragrafos: [
        "O pacote extra pode ser reembolsado em até 7 dias da compra, se não tiver sido usado.",
      ] },
      { titulo: "4. Pagamento recusado", paragrafos: [
        "Se a renovação não for paga, você mantém o acesso por 3 dias de tolerância. Depois disso, as aulas ficam bloqueadas até o pagamento; a revisão e o histórico continuam disponíveis. Após 30 dias, a assinatura é cancelada.",
      ] },
      { titulo: "5. Outros casos", paragrafos: [`Situações excepcionais são analisadas pela nossa equipe. Fale conosco: ${CONTATO}.`] },
    ],
  },
};
