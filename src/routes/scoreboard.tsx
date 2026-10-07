import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { PageHeader, ScoreBadge, Section, T } from "@/components/app/bits";
import { DecisionSelect } from "@/components/app/DecisionSelect";
import { useMetrics } from "@/state/store";
import type { FaucetMetrics } from "@/domain/metrics";
import { brl, brlh, hrs } from "@/domain/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scoreboard")({
  head: () => ({
    meta: [
      { title: "Scoreboard — PUB War" },
      { name: "description", content: "Ranking de torneiras por margem/hora e caixa/hora com funil completo." },
      { property: "og:title", content: "Scoreboard — PUB War" },
      { property: "og:description", content: "Ranking de torneiras por margem/hora e caixa/hora com funil completo." },
    ],
  }),
  component: Scoreboard,
});

type Col = { k: keyof FaucetMetrics | "score"; label: string; fmt: (m: FaucetMetrics) => string };
const COLS: Col[] = [
  { k: "prospects", label: "Prosp.", fmt: (m) => String(m.prospects) },
  { k: "contacts", label: "Contatos", fmt: (m) => String(m.contacts) },
  { k: "responses", label: "Resp.", fmt: (m) => String(m.responses) },
  { k: "conversations", label: "Conversas", fmt: (m) => String(m.conversations) },
  { k: "diagnostics", label: "Diag.", fmt: (m) => String(m.diagnostics) },
  { k: "proposals", label: "Propostas", fmt: (m) => String(m.proposals) },
  { k: "sales", label: "Vendas", fmt: (m) => String(m.sales) },
  { k: "payments", label: "Pagtos", fmt: (m) => String(m.payments) },
  { k: "cash", label: "Caixa", fmt: (m) => brl(m.cash) },
  { k: "hours", label: "Horas", fmt: (m) => hrs(m.hours) },
  { k: "margin", label: "Margem", fmt: (m) => brl(m.margin) },
  { k: "cashPerHour", label: "Caixa/h", fmt: (m) => brlh(m.cashPerHour) },
  { k: "marginPerHour", label: "Margem/h", fmt: (m) => brlh(m.marginPerHour) },
];

function Scoreboard() {
  const { db, idx } = useMetrics();
  const [sortKey, setSortKey] = useState<Col["k"]>("marginPerHour");
  const val = (m: FaucetMetrics, k: Col["k"]) => (k === "score" ? m.score.total : (m[k] as number));
  const rows = db.faucets.map((f) => ({ f, m: idx.faucet.get(f.id)! })).sort((a, b) => val(b.m, sortKey) - val(a.m, sortKey));
  const chartKey = sortKey === "cashPerHour" ? "cashPerHour" : "marginPerHour";
  const chart = rows.map((r) => ({ name: r.f.name.split(" · ")[0], full: r.f.name, v: Math.round(r.m[chartKey]) }));

  return (
    <>
      <PageHeader
        title="Scoreboard"
        sub="Clique no cabeçalho para ordenar. Ranking principal: Margem/hora ou Caixa/hora."
        actions={
          <div className="flex rounded-md border p-0.5">
            {(["marginPerHour", "cashPerHour", "score"] as const).map((k) => (
              <button key={k} onClick={() => setSortKey(k)} className={cn("rounded px-2.5 py-1 text-[12px]", sortKey === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {k === "marginPerHour" ? "Margem/hora" : k === "cashPerHour" ? "Caixa/hora" : "Score"}
              </button>
            ))}
          </div>
        }
      />
      <Section title={`Ranking por ${chartKey === "cashPerHour" ? "caixa/hora" : "margem/hora"} (R$/h)`} className="mb-3">
        <div className="h-48 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={40} />
              <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: number) => [`R$ ${v}/h`, ""]} labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""} />
              <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                {chart.map((c, i) => <Cell key={i} fill={i < 2 ? "var(--success)" : c.v === 0 ? "var(--danger)" : "var(--primary)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
      <Section title="Métricas por torneira">
        <div className={T.wrap}>
          <table className={T.table}>
            <thead>
              <tr>
                <th className={T.th}>#</th>
                <th className={T.th}>Torneira</th>
                {COLS.map((c) => (
                  <th key={c.k} className={cn(T.th, T.thBtn, "text-right", sortKey === c.k && "!text-primary")} onClick={() => setSortKey(c.k)}>{c.label}{sortKey === c.k && " ↓"}</th>
                ))}
                <th className={cn(T.th, T.thBtn, sortKey === "score" && "!text-primary")} onClick={() => setSortKey("score")}>Score</th>
                <th className={T.th}>Decisão</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ f, m }, i) => (
                <tr key={f.id} className={T.tr}>
                  <td className={T.td + " num text-muted-foreground"}>{i + 1}</td>
                  <td className={T.td}><Link to="/torneiras/$id" params={{ id: f.id }} className="font-medium hover:text-primary">{f.name}</Link></td>
                  {COLS.map((c) => (
                    <td key={c.k} className={cn(T.td, "num text-right", sortKey === c.k && "font-semibold text-primary")}>{c.fmt(m)}</td>
                  ))}
                  <td className={T.td}><ScoreBadge score={m.score} /></td>
                  <td className={T.td}><DecisionSelect id={f.id} value={f.decision} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Como o score é calculado (0–10)" className="mt-3">
        <ul className="grid gap-1 p-3 text-[12px] text-muted-foreground md:grid-cols-2">
          <li><b className="text-foreground">Mercado 0–2:</b> taxa de resposta ≥20% = 2, ≥8% = 1 (mín. 3 contatos)</li>
          <li><b className="text-foreground">Conversão 0–2:</b> fechamento ≥40% = 2; ≥15% ou diagnóstico ≥50% = 1</li>
          <li><b className="text-foreground">Caixa 0–3:</b> ≥R$6.000 = 3, ≥R$2.500 = 2, &gt;0 = 1</li>
          <li><b className="text-foreground">Economia 0–2:</b> margem/hora ≥R$150 = 2, ≥R$60 = 1</li>
          <li><b className="text-foreground">Repetibilidade 0–1:</b> ≥2 clientes pagantes, ou SKU recorrente com 1 pagante</li>
          <li><b className="text-foreground">Leitura:</b> 0–2 FRIA · 3–4 TESTE · 5–6 TRAÇÃO · 7–8 VENCEDORA · 9–10 MÁQUINA</li>
        </ul>
      </Section>
    </>
  );
}
