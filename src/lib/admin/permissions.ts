/** Perfis e matriz de permissões do painel (Manual 11.1 e 11.2). */
export type Perfil = "super_admin" | "administrador" | "financeiro" | "suporte" | "conteudo" | "moderacao" | "leitura";

export type Acao =
  | "ver_painel"
  | "ver_ficha"
  | "suspender"
  | "banir"
  | "excluir_logico"
  | "excluir_definitivo"
  | "dar_bonus"
  | "trocar_plano"
  | "reembolsar"
  | "criar_cupom"
  | "entrar_como_aluno"
  | "publicar_cenario"
  | "trocar_fornecedor"
  | "kill_switch"
  | "gerir_equipe"
  | "ver_auditoria"
  | "exportar_dados"
  | "gerir_chaves"
  | "conceder_cortesia";

/** "parcial" = acesso restrito (ex.: Moderação vê ficha sem dados financeiros; Leitura exporta só agregados). */
export type Nivel = true | false | "parcial";

const T = true, F = false, P = "parcial" as const;
//                                   super adm  fin  sup  cont mod  leit
const MATRIZ: Record<Acao, [Nivel, Nivel, Nivel, Nivel, Nivel, Nivel, Nivel]> = {
  ver_painel:         [T, T, T, T, T, T, T],
  ver_ficha:          [T, T, T, T, F, P, F],
  suspender:          [T, T, F, T, F, T, F],
  banir:              [T, T, F, F, F, T, F],
  excluir_logico:     [T, T, F, F, F, F, F],
  excluir_definitivo: [T, F, F, F, F, F, F],
  dar_bonus:          [T, T, T, P, F, F, F], // Suporte: até 30 min
  trocar_plano:       [T, T, T, F, F, F, F],
  reembolsar:         [T, T, T, F, F, F, F],
  criar_cupom:        [T, T, T, F, F, F, F],
  entrar_como_aluno:  [T, T, F, P, F, F, F], // Suporte: com permissão do aluno
  publicar_cenario:   [T, T, F, F, T, F, F],
  trocar_fornecedor:  [T, T, F, F, F, F, F],
  kill_switch:        [T, F, F, F, F, F, F],
  gerir_equipe:       [T, F, F, F, F, F, F],
  ver_auditoria:      [T, T, P, F, F, F, F], // Financeiro: própria área
  exportar_dados:     [T, T, P, F, F, F, P], // Financeiro: financeiro; Leitura: agregados
  gerir_chaves:       [T, F, F, F, F, F, F], // chaves de integração: só Super Admin (Manual 11.3, P18)
  conceder_cortesia:  [T, T, F, F, F, F, F], // aluno sem cobrança: Super Admin e Administrador
};
const ORDEM: Perfil[] = ["super_admin", "administrador", "financeiro", "suporte", "conteudo", "moderacao", "leitura"];

export function permissao(perfil: Perfil, acao: Acao): Nivel {
  return MATRIZ[acao][ORDEM.indexOf(perfil)];
}
export const pode = (perfil: Perfil, acao: Acao) => permissao(perfil, acao) !== false;

export const LIMITE_BONUS_SUPORTE_MIN = 30;

/** Ações destrutivas: confirmação dupla, motivo por escrito e código 2FA (Manual 11.4). */
export const ACOES_DESTRUTIVAS: Acao[] = ["gerir_chaves", "banir", "excluir_logico", "excluir_definitivo", "reembolsar", "trocar_fornecedor", "kill_switch"];

export const PERFIL_NOME: Record<Perfil, string> = {
  super_admin: "Super Admin", administrador: "Administrador", financeiro: "Financeiro", suporte: "Suporte",
  conteudo: "Conteúdo", moderacao: "Moderação", leitura: "Leitura",
};
