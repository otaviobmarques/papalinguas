import { describe, expect, it } from "vitest";
import { gerarSenha, linkDeAcesso, mensagemDeConvite } from "@/lib/domain/acesso";

describe("acesso do aluno cortesia", () => {
  it("gera senha em 3 blocos, sem caracteres ambíguos", () => {
    for (let i = 0; i < 50; i++) {
      const s = gerarSenha();
      expect(s).toMatch(/^[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}$/);
      expect(s).not.toMatch(/[0O1lI]/);
    }
  });
  it("senhas diferentes a cada chamada", () => {
    expect(new Set(Array.from({ length: 20 }, () => gerarSenha())).size).toBe(20);
  });
  it("link abre o login com e-mail preenchido e modo senha", () => {
    const l = linkDeAcesso("ana+teste@exemplo.com", true);
    expect(l).toContain("/comecar/conta?entrar=1&senha=1&email=ana%2Bteste%40exemplo.com");
    expect(linkDeAcesso("a@b.com", false)).not.toContain("senha=1");
  });
  it("mensagem traz link, e-mail e senha", () => {
    const m = mensagemDeConvite({ nome: "Ana Souza", plano: "Fluente", ate: "13/12/2026", email: "ana@x.com", link: "https://l", senha: "abcd-efgh-jkmn" });
    expect(m).toContain("Oi, Ana!");
    expect(m).toContain("Senha: abcd-efgh-jkmn");
    expect(m).toContain("https://l");
    expect(mensagemDeConvite({ nome: "Ana", plano: "Essencial", ate: "x", email: "ana@x.com", link: "https://l" })).toContain("código de 6 dígitos");
  });
});
