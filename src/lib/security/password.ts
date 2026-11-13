import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (s: string, salt: Buffer, len: number, o: object) => Promise<Buffer>;
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Hash de senha: "scrypt:N:r:p:salt:hash" (base64). Nunca guardar a senha em texto. */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const h = await scrypt(senha.normalize("NFKC"), salt, 32, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), h.toString("base64")].join(":");
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [alg, N, r, p, salt, hash] = armazenado.split(":");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const esperado = Buffer.from(hash, "base64");
  const h = await scrypt(senha.normalize("NFKC"), Buffer.from(salt, "base64"), esperado.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return h.length === esperado.length && timingSafeEqual(h, esperado);
}
