import { describe, expect, it } from "vitest";
import { estimarPorRegra, lerAvaliacao, pedidoAvaliacao } from "@/lib/domain/nivel";

describe("teste de nível", () => {
  it("lê o JSON do modelo mesmo com texto ao redor", () => {
    expect(lerAvaliacao('Aqui está: {"nivel":"B1","confianca":0.72,"consegue":"Você já conversa sobre trabalho."} fim'))
      .toEqual({ nivel: "B1", confianca: 0.72, consegue: "Você já conversa sobre trabalho." });
  });
  it("rejeita nível inválido ou JSON quebrado", () => {
    expect(lerAvaliacao('{"nivel":"C2","confianca":1,"consegue":"x x x"}')).toBeNull();
    expect(lerAvaliacao("sem json")).toBeNull();
    expect(lerAvaliacao('{"nivel":"A2",')).toBeNull();
  });
  it("regra sem IA é conservadora", () => {
    expect(estimarPorRegra([{ quem: "aluno", texto: "hi" }]).nivel).toBe("A1");
    const longas = Array.from({ length: 4 }, () => ({ quem: "aluno" as const, texto: "I work as a developer in a company" }));
    const r = estimarPorRegra(longas);
    expect(r.nivel).toBe("B1");
    expect(r.confianca).toBeLessThan(0.6);
  });
  it("monta o pedido só com as falas e marca quem falou", () => {
    const p = pedidoAvaliacao("en", [{ quem: "tutor", texto: "Hi!" }, { quem: "aluno", texto: "Hello, I am Ana" }, { quem: "aluno", texto: " " }]);
    expect(p).toContain("inglês");
    expect(p).toContain("TUTOR: Hi!");
    expect(p).toContain("ALUNO: Hello, I am Ana");
    expect(p.match(/ALUNO:/g)?.length).toBe(1);
  });
});
