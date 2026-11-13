import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifra simétrica AES-256-GCM para guardar chaves de integração no banco.
 * Formato: base64(iv[12] | tag[16] | dados). A chave mestra vem de KEYS_ENCRYPTION_KEY (32 bytes em base64).
 */
export function chaveMestra(base64 = process.env.KEYS_ENCRYPTION_KEY): Buffer {
  if (!base64) throw new Error("KEYS_ENCRYPTION_KEY não configurada");
  const k = Buffer.from(base64, "base64");
  if (k.length !== 32) throw new Error("KEYS_ENCRYPTION_KEY deve ter 32 bytes (base64)");
  return k;
}

export function cifrar(texto: string, chave: Buffer = chaveMestra()): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave, iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), dados]).toString("base64");
}

export function decifrar(pacote: string, chave: Buffer = chaveMestra()): string {
  const b = Buffer.from(pacote, "base64");
  const d = createDecipheriv("aes-256-gcm", chave, b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}

/** Mostra só o começo e os 4 últimos caracteres: "sk-proj-…fIA". */
export function mascarar(chave: string): string {
  if (chave.length <= 12) return "…" + chave.slice(-4);
  const prefixo = chave.match(/^(sk-[a-z]+-|sk-)/i)?.[0] ?? chave.slice(0, 3);
  return `${prefixo}…${chave.slice(-4)}`;
}
