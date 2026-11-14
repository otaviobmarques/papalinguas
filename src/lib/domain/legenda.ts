/**
 * Legenda da aula em trechos curtos, acompanhando a voz do tutor.
 * A transcrição da IA chega antes do áudio; mostrar tudo de uma vez faz o aluno ler adiantado.
 * Aqui o texto é dividido em trechos de poucas palavras e o trecho da vez é escolhido pelo tempo de fala.
 */

const FIM_FRASE = /[.!?…:;。！？：；]$/;
const VIRGULA = /[,、，]$/;

/** Separa palavras em grupos que terminam quando `fim` casa com a palavra. */
function agrupar(palavras: string[], fim: RegExp): string[][] {
  const grupos: string[][] = [];
  let atual: string[] = [];
  for (const p of palavras) {
    atual.push(p);
    if (fim.test(p)) {
      grupos.push(atual);
      atual = [];
    }
  }
  if (atual.length) grupos.push(atual);
  return grupos;
}

/** Corta um grupo longo em partes de tamanho parecido (evita sobrar "say anything." sozinho). */
function equilibrar(palavras: string[], max: number): string[][] {
  const partes = Math.ceil(palavras.length / max);
  const tam = Math.ceil(palavras.length / partes);
  const out: string[][] = [];
  for (let i = 0; i < palavras.length; i += tam) out.push(palavras.slice(i, i + tam));
  return out;
}

/** Junta as palavras de volta, sem o espaço que foi posto depois da pontuação japonesa/chinesa. */
const juntar = (p: string[]) => p.join(" ").replace(/([。！？、，：；]) /g, "$1");

/**
 * Divide o texto em trechos curtos: uma frase por vez; frase longa é cortada nas vírgulas,
 * e só depois em partes de tamanho parecido. Uma frase de até `max + 2` palavras fica inteira.
 */
export function dividirLegenda(texto: string, max = 7): string[] {
  // japonês e mandarim não separam palavras com espaço: a pontuação deles vira o ponto de corte
  const palavras = texto.replace(/([。！？、，：；])(?=\S)/g, "$1 ").trim().split(/\s+/).filter(Boolean);
  const trechos: string[] = [];
  for (const frase of agrupar(palavras, FIM_FRASE)) {
    if (frase.length <= max + 2) {
      trechos.push(juntar(frase));
      continue;
    }
    let atual: string[] = [];
    const fechar = () => {
      if (atual.length) trechos.push(juntar(atual));
      atual = [];
    };
    for (const oracao of agrupar(frase, VIRGULA)) {
      if (atual.length + oracao.length <= max + 2) {
        atual.push(...oracao);
        continue;
      }
      fechar();
      if (oracao.length <= max + 2) atual = [...oracao];
      else for (const parte of equilibrar(oracao, max)) trechos.push(juntar(parte));
    }
    fechar();
  }
  return trechos;
}

/**
 * Índice do trecho que está sendo falado depois de `ms` milissegundos de fala,
 * a `cps` caracteres por segundo. Não passa do último trecho.
 */
export function trechoAtual(trechos: string[], ms: number, cps: number): number {
  if (trechos.length === 0) return -1;
  const falados = (Math.max(0, ms) / 1000) * cps;
  let soma = 0;
  for (let i = 0; i < trechos.length; i++) {
    soma += trechos[i].length + 1;
    if (falados < soma) return i;
  }
  return trechos.length - 1;
}

/** Ajusta a velocidade estimada com a fala que acabou de terminar (média móvel, ignora medidas absurdas). */
export function calibrarVelocidade(cpsAtual: number, caracteres: number, ms: number): number {
  if (ms < 1500 || caracteres < 20) return cpsAtual;
  const medido = caracteres / (ms / 1000);
  if (medido < 5 || medido > 30) return cpsAtual;
  return cpsAtual * 0.6 + medido * 0.4;
}
