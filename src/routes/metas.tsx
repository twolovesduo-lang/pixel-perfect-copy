import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Kpi, PageHeader, Section, T } from "@/components/app/bits";
import { saveGoals, useDB } from "@/state/store";
import { goalProgress } from "@/domain/metrics";
import { brl, pct } from "@/domain/format";

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title: "Meta de Caixa — PUB War" },
      { name: "description", content: "Metas mensal, semanal e diária com realizado, diferença e projeção." },
      { property: "og:title", content: "Meta de Caixa — PUB War" },
      { property: "og:description", content: "Metas mensal, semanal e diária com realizado, diferença e projeção." },
    ],
  }),
  component: Metas,
});

function Metas() {
  const db = useDB();
  const g = goalProgress(db);
  const [form, setForm] = useState({ ...db.goals });

  return (
    <>
      <PageHeader title="Meta de Caixa" sub="Caixa = pagamentos com status pago. Projeção = ritmo do mês × dias do mês." />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Meta do mês" value={brl(g.monthly.goal)} />
        <Kpi label="Realizado" value={brl(g.monthly.done)} tone="primary" sub={pct(g.monthly.pct)} />
        <Kpi label="Diferença" value={brl(g.monthly.diff)} tone={g.monthly.diff >= 0 ? "success" : "danger"} />
        <Kpi label="Projeção" value={brl(g.monthly.projection)} tone={g.monthly.projection >= g.monthly.goal ? "success" : "danger"} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_340px]">
        <Section title="Acompanhamento">
          <table className={T.table}>
            <thead><tr>{["Período", "Meta", "Realizado", "Diferença", "%", ""].map((h) => <th key={h} className={T.th}>{h}</th>)}</tr></thead>
            <tbody>
              {([["Mês", g.monthly], ["Semana (últimos 7 dias)", g.weekly], ["Hoje", g.daily]] as const).map(([k, r]) => (
                <tr key={k}>
                  <td className={T.td}>{k}</td>
                  <td className={T.td + " num"}>{brl(r.goal)}</td>
                  <td className={T.td + " num text-primary"}>{brl(r.done)}</td>
                  <td className={T.td + (r.diff >= 0 ? " num text-success" : " num text-danger")}>{brl(r.diff)}</td>
                  <td className={T.td + " num"}>{pct(r.pct)}</td>
                  <td className={T.td + " w-1/3"}>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, r.pct * 100)}%` }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Configurar metas">
          <form
            className="space-y-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if ([form.monthly, form.weekly, form.daily].some((n) => !(n >= 0))) { toast.error("Valores inválidos"); return; }
              saveGoals(form);
              toast.success("Metas salvas");
            }}
          >
            {(["monthly", "weekly", "daily"] as const).map((k) => (
              <label key={k} className="block">
                <span className="label-xs">{k === "monthly" ? "Meta mensal" : k === "weekly" ? "Meta semanal" : "Meta diária"} (R$)</span>
                <input type="number" min={0} className="field mt-1" value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} />
              </label>
            ))}
            <div className="flex justify-between gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, weekly: Math.round(form.monthly / 4), daily: Math.round(form.monthly / 20) })}>Derivar da mensal</Button>
              <Button size="sm" type="submit">Salvar</Button>
            </div>
          </form>
        </Section>
      </div>
    </>
  );
}
