/**
 * Tutores com personagem do Rive (arquivo .riv montado por um animador).
 * Contrato do arquivo: docs/tutores-rive.md. Quando um tutor está aqui, o app usa o Rive
 * no lugar da foto animada e do desenho SVG, em todas as telas.
 *
 * Para ligar um tutor: coloque o arquivo em public/tutores/<slug>/tutor.riv e adicione o slug abaixo.
 */
export const TUTORES_RIVE: Record<string, { arquivo: string }> = {
  // exemplo: ruby: { arquivo: "/tutores/ruby/tutor.riv" },
};

export const temRive = (slug?: string): boolean => !!slug && slug in TUTORES_RIVE;

/** Nomes combinados com o animador (docs/tutores-rive.md). */
export const RIVE = {
  artboard: "Tutor",
  maquina: "Tutor",
  entradas: { visema: "visema", estado: "estado", expressao: "expressao", acenar: "acenar" },
  estados: { repouso: 0, ouvindo: 1, pensando: 2, falando: 3 },
  expressoes: { neutra: 0, sorriso: 1, duvida: 2, comemoracao: 3 },
} as const;
