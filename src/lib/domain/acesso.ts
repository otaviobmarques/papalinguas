import { SITE } from "@/lib/site";

/** Link de acesso do aluno: abre o login com o e-mail preenchido (e a opção de senha, quando houver). */
export const linkDeAcesso = (email: string, comSenha: boolean) =>
  `${SITE.url}/comecar/conta?entrar=1${comSenha ? "&senha=1" : ""}&email=${encodeURIComponent(email)}`;

const ALFABETO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/l/I

/** Senha forte e fácil de digitar no celular: 3 blocos de 4 (ex.: "k7Pq-2mXa-9TzH"). */
export function gerarSenha(aleatorio: (n: number) => Uint32Array = (n) => crypto.getRandomValues(new Uint32Array(n))): string {
  const v = aleatorio(12);
  const c = Array.from(v, (x) => ALFABETO[x % ALFABETO.length]).join("");
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
}

export function mensagemDeConvite(p: { nome: string; plano: string; ate: string; email: string; link: string; senha?: string }): string {
  const primeiro = p.nome.trim().split(" ")[0] || "tudo bem";
  const topo = `Oi, ${primeiro}! Liberei para você o Papalinguas ${p.plano}, sem custo, até ${p.ate}.`;
  return p.senha
    ? `${topo}\n\nAcesse: ${p.link}\nE-mail: ${p.email}\nSenha: ${p.senha}\n\nDepois de entrar, você pode trocar a senha em Perfil.`
    : `${topo}\n\nAcesse: ${p.link}\nEntre com o e-mail ${p.email}: você vai receber um código de 6 dígitos para confirmar.`;
}
