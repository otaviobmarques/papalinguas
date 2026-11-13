import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cifrar, decifrar, mascarar } from "@/lib/security/secretBox";
import { conferirSenha, hashSenha } from "@/lib/security/password";
import { assinarToken, verificarToken } from "@/lib/security/adminSession";

describe("cofre (AES-256-GCM)", () => {
  const k = randomBytes(32);
  it("cifra e decifra", () => {
    const c = cifrar("sk-proj-exemplo-1234", k);
    expect(c).not.toContain("sk-proj");
    expect(decifrar(c, k)).toBe("sk-proj-exemplo-1234");
  });
  it("recusa dado adulterado ou chave errada", () => {
    const c = Buffer.from(cifrar("segredo", k), "base64");
    c[c.length - 1] ^= 1;
    expect(() => decifrar(c.toString("base64"), k)).toThrow();
    expect(() => decifrar(cifrar("segredo", k), randomBytes(32))).toThrow();
  });
  it("mascara", () => {
    expect(mascarar("sk-proj-abcdefghijklmnop1234")).toBe("sk-proj-…1234");
    expect(mascarar("sk-ant-api03-xxxxxxxxxxxxWXYZ")).toBe("sk-ant-…WXYZ");
  });
});

describe("senha (scrypt)", () => {
  it("confere só a senha certa", async () => {
    const h = await hashSenha("Senha#Forte1");
    expect(h.startsWith("scrypt:")).toBe(true);
    expect(await conferirSenha("Senha#Forte1", h)).toBe(true);
    expect(await conferirSenha("senha#forte1", h)).toBe(false);
    expect(await conferirSenha("x", "lixo")).toBe(false);
  });
});

describe("sessão do admin", () => {
  const segredo = "s".repeat(40);
  const agora = Date.UTC(2026, 10, 13, 12);
  it("assina, verifica e expira em 8 h", () => {
    const t = assinarToken({ sub: "env:admin", nome: "Admin", perfil: "super_admin" }, agora, segredo);
    expect(verificarToken(t, agora + 1000, segredo)?.perfil).toBe("super_admin");
    expect(verificarToken(t, agora + 8 * 3600 * 1000 + 1, segredo)).toBeNull();
  });
  it("recusa token adulterado ou de outro segredo", () => {
    const t = assinarToken({ sub: "a", nome: "A", perfil: "leitura" }, agora, segredo);
    const [corpo, sig] = t.split(".");
    const falso = Buffer.from(JSON.stringify({ sub: "a", nome: "A", perfil: "super_admin", exp: 9e9 })).toString("base64url");
    expect(verificarToken(`${falso}.${sig}`, agora, segredo)).toBeNull();
    expect(verificarToken(`${corpo}.${sig}`, agora, "o".repeat(40))).toBeNull();
  });
});
