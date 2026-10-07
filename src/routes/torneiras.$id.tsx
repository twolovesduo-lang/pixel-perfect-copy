import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kpi, PageHeader, Pill, ScoreBadge, Section, T, tierTone, Empty } from "@/components/app/bits";
import { DecisionSelect } from "@/components/app/DecisionSelect";
import { useForms } from "@/components/app/EntityForms";
import { useProspectSheet } from "@/components/app/ProspectSheet";
import { useMetrics } from "@/state/store";
import { allocate } from "@/domain/metrics";
import { brl, brlh, hrs, pct } from "@/domain/format";
import { STAGES } from "@/domain/types";

export const Route = createFileRoute("/torneiras/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da torneira — PUB War" },
      { name: "description", content: "Funil, score, prospects e recomendação de energia de uma torneira." },
      { property: "og:title", content: "Detalhe da torneira — PUB War" },
      { property: "og:description", content: "Funil, score, prospects e recomendação de energia de uma torneira." },
    ],
  }),
  component: FaucetDetail,
});

function FaucetDetail() {
  const { id } = Route.useParams();
  const { db, idx } = useMetrics();
  const { openForm } = useForms();
  const { openProspect } = useProspectSheet();
  const f = db.faucets.find((x) => x.id === id);
  if (!f) return <Empty>Torneira não encontrada. <Link to="/torneiras" className="text-primary">Voltar</Link></Empty>;
  const m = idx.faucet.get(f.id)!;
  const sku = db.skus.find((s) => s.id === f.skuId);
  const a = allocate(f, m);
  const ps = db.prospects.filter((p) => p.faucetId === f.id);
  const s = m.score;
  const comps: [string, number, number][] = [["Mercado", s.market, 2], ["Conversão", s.conversion, 2], ["Caixa", s.cash, 3], ["Economia", s.economy, 2], ["Repetibilidade", s.repeatability, 1]];

  return (
    <>
      <Link to="/torneiras" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Torneiras</Link>
      <PageHeader
        title={f.name}
        sub={`${sku?.name ?? "—"} · ICP: ${f.icp} · Canal: ${f.channel}`}
        actions={
          <>
            <DecisionSelect id={f.id} value={f.decision} />
            <Button size="sm" variant="secondary" onClick={() => openForm("faucet", f as never)}>Editar</Button>
            <Button size="sm" variant="secondary" onClick={() => openForm("activity", { type: "horas", faucetId: f.id, description: "Horas de operação" })}><Plus className="size-3.5" /> Horas</Button>
            <Button size="sm" onClick={() => openForm("prospect", { faucetId: f.id })}><Plus className="size-3.5" /> Prospect</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Caixa" value={brl(m.cash)} sub={`${brl(m.pendingCash)} pendente`} tone="primary" />
        <Kpi label="Horas" value={hrs(m.hours)} />
        <Kpi label="Margem" value={brl(m.margin)} sub={`${sku?.marginPct ?? 0}% bruta`} />
        <Kpi label="Caixa/hora" value={brlh(m.cashPerHour)} />
        <Kpi label="Margem/hora" value={brlh(m.marginPerHour)} tone="success" />
        <Kpi label="Recomendação" value={<Pill tone={tierTone(a.tier)}>{a.tier}</Pill>} sub={a.reasons.join(" · ")} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Section title="Score de tração">
          <div className="space-y-2 p-3">
            <ScoreBadge score={s} />
            {comps.map(([k, v, max]) => (
              <div key={k} className="flex items-center gap-2 text-[12px]">
                <span className="w-28 text-muted-foreground">{k}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: max }).map((_, i) => <span key={i} className={i < v ? "h-2.5 w-6 rounded-sm bg-primary" : "h-2.5 w-6 rounded-sm bg-muted"} />)}
                </div>
                <span className="num">{v}/{max}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Taxas">
          <div className="grid grid-cols-2 gap-2 p-3 text-[12px]">
            {[
              ["Resposta", m.responseRate, `${m.responses}/${m.contacts}`],
              ["Diagnóstico", m.diagnosticRate, `${m.diagnostics}/${m.conversations}`],
              ["Proposta", m.proposalRate, `${m.proposals}/${m.diagnostics}`],
              ["Fechamento", m.closeRate, `${m.sales}/${m.proposals}`],
            ].map(([k, v, frac]) => (
              <div key={k as string} className="rounded-md border p-2">
                <div className="label-xs">{k}</div>
                <div className="num text-lg font-semibold">{pct(v as number)}</div>
                <div className="num text-[11px] text-muted-foreground">{frac}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section title={`Prospects (${ps.length})`} className="mt-3">
        <div className={T.wrap}>
          <table className={T.table}>
            <thead><tr>{["", "Empresa", "Decisor", "Estágio", "Sinal de dor"].map((h) => <th key={h} className={T.th}>{h}</th>)}</tr></thead>
            <tbody>
              {ps.map((p) => (
                <tr key={p.id} className={T.tr + " cursor-pointer"} onClick={() => openProspect(p.id)}>
                  <td className={T.td}><Pill tone={p.priority === "A" ? "success" : p.priority === "B" ? "warning" : "muted"}>{p.priority}</Pill></td>
                  <td className={T.td + " font-medium"}>{p.company}</td>
                  <td className={T.td}>{p.decisionMaker}</td>
                  <td className={T.td}><Pill tone="info">{STAGES[idx.prospectStage.get(p.id) ?? 0]}</Pill></td>
                  <td className={T.td + " text-muted-foreground"}>{p.painSignal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ps.length === 0 && <Empty>Sem prospects nesta torneira.</Empty>}
        </div>
      </Section>
    </>
  );
}
