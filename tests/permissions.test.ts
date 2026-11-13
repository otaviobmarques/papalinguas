import { describe, expect, it } from "vitest";
import { permissao, pode } from "@/lib/admin/permissions";

describe("matriz de permissões (Manual 11.2)", () => {
  it("só Super Admin aciona kill switch, gere equipe e exclui definitivo", () => {
    for (const a of ["kill_switch", "gerir_equipe", "excluir_definitivo"] as const) {
      expect(pode("super_admin", a)).toBe(true);
      expect(pode("administrador", a)).toBe(false);
    }
  });
  it("financeiro reembolsa mas não bane", () => {
    expect(pode("financeiro", "reembolsar")).toBe(true);
    expect(pode("financeiro", "banir")).toBe(false);
  });
  it("suporte dá bônus com limite e suspende", () => {
    expect(permissao("suporte", "dar_bonus")).toBe("parcial");
    expect(pode("suporte", "suspender")).toBe(true);
    expect(pode("suporte", "reembolsar")).toBe(false);
  });
  it("conteúdo publica cenário e não vê ficha", () => {
    expect(pode("conteudo", "publicar_cenario")).toBe(true);
    expect(pode("conteudo", "ver_ficha")).toBe(false);
  });
  it("leitura só vê painel e exporta agregados", () => {
    expect(pode("leitura", "ver_painel")).toBe(true);
    expect(permissao("leitura", "exportar_dados")).toBe("parcial");
    expect(pode("leitura", "ver_ficha")).toBe(false);
  });
});
