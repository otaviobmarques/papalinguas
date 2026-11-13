import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * subscriptions tem duas chaves para plans (plan_id e pending_plan_id). Sem dizer qual,
 * o Supabase recusa a consulta (PGRST201) e a rota quebra em produção — o Postgres local não pega isso.
 */
function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

describe("consultas ao Supabase", () => {
  it("embed de plans sempre indica a chave estrangeira", () => {
    const problemas = arquivos(path.resolve(__dirname, "../src")).flatMap((f) =>
      readFileSync(f, "utf8").split("\n").flatMap((linha, i) =>
        /[\s,(]plans\(/.test(linha) && !linha.includes('from("plans")') ? [`${path.relative(process.cwd(), f)}:${i + 1}`] : [],
      ),
    );
    expect(problemas).toEqual([]);
  });
});
