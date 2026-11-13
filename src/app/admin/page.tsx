import { formatBRL } from "@/lib/domain/plans";

/** P1. Painel geral (dados fictícios até a sprint 5 ligar as consultas) */
const KPIS = [
  { k: "Assinantes ativos", v: "1.024", d: "+38 na semana" },
  { k: "MRR", v: formatBRL(6_190_000), d: "+4,1% no mês" },
  { k: "Ticket médio", v: formatBRL(6_045), d: "" },
  { k: "Churn mensal", v: "4,8%", d: "-0,6 p.p." },
  { k: "Nivelamento → assinatura", v: "31%", d: "" },
  { k: "Latência p95", v: "1,08 s", d: "meta 1,2 s" },
];
const FORNECEDORES = [
  { n: "OpenAI Realtime", s: "ok" }, { n: "Azure Speech", s: "ok" }, { n: "Asaas", s: "atencao" }, { n: "Supabase", s: "ok" }, { n: "Resend", s: "ok" },
] as const;
const ATENCAO = [
  { a: "aluno-4821", m: "Consumo 6× acima da média" },
  { a: "aluno-1907", m: "Pagamento recusado (2ª tentativa)" },
  { a: "aluno-3310", m: "Pedido de garantia (7 dias)" },
  { a: "aluno-0712", m: "Contestação aberta · prazo 5 dias" },
];

export default function PainelGeral() {
  const gastoHoje = 74, teto = 230;
  const pctIA = 33.8;
  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">P1 · Painel geral</h1>
        <div className="flex gap-2 text-sm">
          <select className="min-h-11 rounded-xl border border-line bg-surface px-3" aria-label="Período"><option>Últimos 30 dias</option><option>Hoje</option><option>7 dias</option></select>
          <select className="min-h-11 rounded-xl border border-line bg-surface px-3" aria-label="Idioma"><option>Todos os idiomas</option><option>Inglês</option><option>Espanhol</option><option>Português</option></select>
          <button className="btn-ghost min-h-11 py-2 text-sm">Exportar CSV</button>
        </div>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {KPIS.map((x) => (
          <div key={x.k} className="card p-4"><p className="text-sm text-ink-soft">{x.k}</p><p className="text-2xl font-extrabold tabular-nums">{x.v}</p>{x.d && <p className="text-xs text-ink-soft">{x.d}</p>}</div>
        ))}
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">Custo de IA ÷ receita líquida</h2>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{pctIA.toLocaleString("pt-BR")}%</p>
          <div className="mt-2 h-2.5 rounded-full bg-surface-2"><div className={`h-full rounded-full ${pctIA > 35 ? "bg-danger" : "bg-brand"}`} style={{ width: `${(pctIA / 50) * 100}%` }} /></div>
          <p className="mt-1 text-xs text-ink-soft">Meta: abaixo de 35%</p>
        </div>
        <div className="card">
          <h2 className="font-bold">Gasto com IA hoje</h2>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">US$ {gastoHoje} <span className="text-base font-semibold text-ink-soft">de US$ {teto}</span></p>
          <div className="mt-2 h-2.5 rounded-full bg-surface-2"><div className={`h-full rounded-full ${gastoHoje / teto >= 0.7 ? "bg-warn" : "bg-brand"}`} style={{ width: `${(gastoHoje / teto) * 100}%` }} /></div>
          <p className="mt-1 text-xs text-ink-soft">Alerta em 70% do teto · teto = 2× média de 7 dias (mín. US$ 25)</p>
          <button className="btn mt-3 border border-danger text-danger">Kill switch…</button>
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">Status dos fornecedores</h2>
          <ul className="mt-2 space-y-2">
            {FORNECEDORES.map((f) => (
              <li key={f.n} className="flex items-center justify-between">
                <span>{f.n}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${f.s === "ok" ? "bg-brand-soft text-ok" : "bg-warn-soft text-warn"}`}>{f.s === "ok" ? "● operando" : "● lento"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-bold">Alunos que pedem atenção</h2>
          <ul className="mt-2 divide-y divide-line">
            {ATENCAO.map((a) => <li key={a.a} className="flex justify-between py-2 text-sm"><span className="font-mono">{a.a}</span><span className="text-ink-soft">{a.m}</span></li>)}
          </ul>
        </div>
      </section>
    </main>
  );
}
