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

/** Colunas de cada tabela, lidas das migrações (create table + alter table add column). */
function esquema(): Map<string, Set<string>> {
  const dir = path.resolve(__dirname, "../supabase/migrations");
  const sql = readdirSync(dir).sort().map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n");
  const t = new Map<string, Set<string>>();
  for (const m of sql.matchAll(/create table (?:if not exists )?public\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
    const cols = new Set<string>();
    for (const l of m[2].split("\n")) {
      const c = l.trim().match(/^"?([a-z_][a-z0-9_]*)"?\s+[a-z]/i);
      if (c && !/^(primary|unique|constraint|check|foreign|exclude)$/i.test(c[1])) cols.add(c[1]);
    }
    t.set(m[1], cols);
  }
  for (const m of sql.matchAll(/alter table (?:only )?public\.(\w+)\s+add column (?:if not exists )?"?(\w+)"?/g)) t.get(m[1])?.add(m[2]);
  return t;
}

/** Quebra uma lista de seleção do PostgREST no nível de cima, respeitando parênteses. */
function partes(lista: string): string[] {
  const out: string[] = [];
  let nivel = 0, atual = "";
  for (const ch of lista) {
    if (ch === "(") nivel++;
    if (ch === ")") nivel--;
    if (ch === "," && nivel === 0) { out.push(atual.trim()); atual = ""; } else atual += ch;
  }
  if (atual.trim()) out.push(atual.trim());
  return out;
}

function conferir(tabela: string, lista: string, tabelas: Map<string, Set<string>>, onde: string, erros: string[]) {
  const cols = tabelas.get(tabela);
  if (!cols) return; // tabela fora do esquema público (ex.: auth): não conferimos
  for (const p of partes(lista)) {
    const embed = p.match(/^(?:\w+:)?(\w+)(?:!\w+)?\s*\(([\s\S]*)\)$/);
    if (embed) { conferir(embed[1], embed[2], tabelas, onde, erros); continue; }
    const col = p.replace(/^\w+:/, "").replace(/::\w+$/, "").trim();
    if (col === "*" || !/^\w+$/.test(col)) continue;
    if (!cols.has(col)) erros.push(`${onde}: ${tabela}.${col} não existe`);
  }
}

describe("colunas das consultas existem no banco", () => {
  it("todo .from(tabela).select(colunas) usa colunas que existem nas migrações", () => {
    const tabelas = esquema();
    expect(tabelas.get("users")?.has("email")).toBe(true); // sanidade do leitor de esquema
    const erros: string[] = [];
    for (const f of arquivos(path.resolve(__dirname, "../src"))) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/\.from\("(\w+)"\)\s*\.select\(\s*"([^"]+)"/g)) {
        const linha = src.slice(0, m.index).split("\n").length;
        conferir(m[1], m[2], tabelas, `${path.relative(process.cwd(), f)}:${linha}`, erros);
      }
    }
    expect(erros).toEqual([]);
  });
});
