#!/usr/bin/env node
// Gera o hash scrypt de uma senha para ADMIN_PASSWORD_HASH (ou admin_users.password_hash).
// Uso: node scripts/admin-hash.mjs   (a senha é lida do terminal, sem eco)
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stderr, terminal: true });
rl._writeToOutput = () => {};
process.stderr.write("Senha: ");
rl.question("", (senha) => {
  rl.close();
  process.stderr.write("\n");
  const salt = randomBytes(16);
  const h = scryptSync(senha.normalize("NFKC"), salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  console.log(["scrypt", 16384, 8, 1, salt.toString("base64"), h.toString("base64")].join(":"));
});
