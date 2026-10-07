import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kpi, PageHeader, Section, ScoreBadge, Pill, tierTone, T } from "@/components/app/bits";
import { GoalStrip, TodayGrid } from "@/components/app/today";
import { useForms } from "@/components/app/EntityForms";
import { useMetrics } from "@/state/store";
import { allocate, totals } from "@/domain/metrics";
import { brl, brlh, hrs, pct } from "@/domain/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — PUB War" },
      { name: "description", content: "Caixa recebido, propostas, torneiras e onde colocar energia hoje." },
      { property: "og:title", content: "Command Center — PUB War" },
      { property: "og:description", content: "Caixa recebido, propostas, torneiras e onde colocar energia hoje." },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const { db, idx } = useMetrics();
  const { openForm } = useForms();
  const t = useMemo(() => totals(db, idx), [db, idx]);
  const ranked = db.faucets
    .map((f) => ({ f, m: idx.faucet.get(f.id)!, a: allocate(f, idx.faucet.get(f.id)!) }))
    .sort((x, y) => y.m.marginPerHour - x.m.marginPerHour);
  const winners = ranked.filter((r) => r.m.score.total >= 7).length;
  const paused = ranked.filter((r) => r.f.decision === "PAUSAR").length;
  const testing = ranked.length - winners - paused;

  return (
    <>
      <PageHeader
        title="Command Center"
        sub="Caixa / energia investida. Dados DEMO fictícios até você registrar os seus."
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => openForm("activity", { type: "horas", description: "Horas de operação" })}><Plus className="size-3.5" /> Horas</Button>
            <Button size="sm" variant="secondary" onClick={() => openForm("activity")}><Plus className="size-3.5" /> Atividade</Button>
            <Button size="sm" variant="secondary" onClick={() => openForm("prospect")}><Plus className="size-3.5" /> Prospect</Button>
            <Button size="sm" onClick={() => openForm("payment")}><Plus className="size-3.5" /> Pagamento</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Caixa recebido" value={brl(t.cash)} sub={`${brl(t.pendingCash)} a receber`} tone="primary" />
        <Kpi label="Caixa / hora" value={brlh(t.cashPerHour)} sub={`${hrs(t.hours)} investidas`} />
        <Kpi label="Margem / hora" value={brlh(t.marginPerHour)} sub={`Margem ${brl(t.margin)}`} tone="success" />
        <Kpi label="Propostas abertas" value={t.openProposals} sub={brl(t.openProposalsValue)} />
        <Kpi label="Em andamento" value={t.inProgress} sub={`${t.diagnostics} diagnósticos`} />
        <Kpi label="Contatos → respostas" value={`${t.contacts} → ${t.responses}`} sub={`resposta ${pct(t.responses / (t.contacts || 1))}`} />
        <Kpi label="Conversão" value={pct(t.conversion)} sub="vendas / contatos" />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_320px]">
        <Section
          title="Torneiras por margem/hora"
          right={
            <div className="flex gap-1.5">
              <Pill tone="success">{winners} vencedoras</Pill>
              <Pill tone="info">{testing} em teste</Pill>
              <Pill tone="danger">{paused} pausadas</Pill>
            </div>
          }
        >
          <div className={T.wrap}>
            <table className={T.table}>
              <thead>
                <tr>
                  <th className={T.th}>Torneira</th>
                  <th className={T.th}>Score</th>
                  <th className={T.th + " text-right"}>Caixa</th>
                  <th className={T.th + " text-right"}>Horas</th>
                  <th className={T.th + " text-right"}>Margem/h</th>
                  <th className={T.th}>Recomendação</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 8).map(({ f, m, a }) => (
                  <tr key={f.id} className={T.tr}>
                    <td className={T.td}>
                      <Link to="/torneiras/$id" params={{ id: f.id }} className="font-medium hover:text-primary">{f.name}</Link>
                    </td>
                    <td className={T.td}><ScoreBadge score={m.score} /></td>
                    <td className={T.td + " num text-right"}>{brl(m.cash)}</td>
                    <td className={T.td + " num text-right"}>{hrs(m.hours)}</td>
                    <td className={T.td + " num text-right font-semibold"}>{brlh(m.marginPerHour)}</td>
                    <td className={T.td}><Pill tone={tierTone(a.tier)}>{a.tier}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 px-3 py-2 text-[11.5px]">
            <Link to="/scoreboard" className="text-primary hover:underline">Ranking completo →</Link>
            <Link to="/energia" className="text-primary hover:underline">Onde colocar energia →</Link>
          </div>
        </Section>
        <GoalStrip />
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">HOJE</h2>
        <Link to="/hoje" className="text-[11.5px] text-primary hover:underline">Abrir área Hoje →</Link>
      </div>
      <TodayGrid limit={5} />
    </>
  );
}
