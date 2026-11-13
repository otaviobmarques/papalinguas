import type { Acao } from "./permissions";

/** Telas do painel (Manual 11.3; Telas P1–P19) e a sprint prevista (Manual 18). */
export const TELAS_ADMIN: { codigo: string; slug: string; nome: string; sprint: number; requer: Acao }[] = [
  { codigo: "P1", slug: "", nome: "Painel geral", sprint: 1, requer: "ver_painel" },
  { codigo: "P2", slug: "alunos", nome: "Alunos", sprint: 5, requer: "ver_ficha" },
  { codigo: "P4", slug: "assinaturas", nome: "Assinaturas e pagamentos", sprint: 5, requer: "reembolsar" },
  { codigo: "P5", slug: "reembolsos", nome: "Reembolsos e garantia", sprint: 5, requer: "reembolsar" },
  { codigo: "P6", slug: "contestacoes", nome: "Contestações", sprint: 5, requer: "reembolsar" },
  { codigo: "P7", slug: "cupons", nome: "Cupons e promoções", sprint: 5, requer: "criar_cupom" },
  { codigo: "P8", slug: "planos", nome: "Planos e cotas", sprint: 5, requer: "trocar_plano" },
  { codigo: "P9", slug: "conteudo", nome: "Conteúdo", sprint: 6, requer: "publicar_cenario" },
  { codigo: "P10", slug: "tutores", nome: "Tutores", sprint: 6, requer: "publicar_cenario" },
  { codigo: "P11", slug: "custos", nome: "Custos e fornecedores", sprint: 6, requer: "trocar_fornecedor" },
  { codigo: "P12", slug: "suporte", nome: "Suporte", sprint: 7, requer: "ver_ficha" },
  { codigo: "P13", slug: "moderacao", nome: "Moderação", sprint: 7, requer: "banir" },
  { codigo: "P14", slug: "notificacoes", nome: "Notificações", sprint: 7, requer: "trocar_plano" },
  { codigo: "P15", slug: "equipe", nome: "Equipe e permissões", sprint: 5, requer: "gerir_equipe" },
  { codigo: "P16", slug: "auditoria", nome: "Auditoria", sprint: 5, requer: "ver_auditoria" },
  { codigo: "P17", slug: "privacidade", nome: "Privacidade (LGPD)", sprint: 7, requer: "excluir_logico" },
  { codigo: "P18", slug: "configuracoes", nome: "Configurações", sprint: 6, requer: "trocar_fornecedor" },
  { codigo: "P19", slug: "relatorios", nome: "Relatórios", sprint: 7, requer: "ver_painel" },
];
