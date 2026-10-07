import { Link } from "@tanstack/react-router";
import { useForms } from "./EntityForms";
import { useProspectSheet } from "./ProspectSheet";
import { Empty, Pill, Section } from "./bits";
import { brl, fmtDate, pct, todayISO } from "@/domain/format";
import { goalProgress } from "@/domain/metrics";
import { STAGE, STAGES, type DB } from "@/domain/types";
import { upsert, useDB } from "@/state/store";
import { toast } from "sonner";

export function useToday(db: DB) {
  const t = todayISO();
  const pById = new Map(db.prospects.map((p) => [p.id, p]));
  const oById = new Map(db.opportunities.map((o) => [o.id, o]));
  const active = db.opportunities.filter((o) => o.stage < STAGE.evidencia);
  return {
    contacts: active.filter((o) => o.stage <= STAGE.qualificado).sort((a, b) => (pById.get(a.prospectId)?.priority ?? "C").localeCompare(pById.get(b.prospectId)?.priority ?? "C")),
    followups: active.filter((o) => o.nextActionDate && o.nextActionDate <= t && o.stage >= STAGE.abordado).sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate)),
    diagnostics: active.filter((o) => o.stage === STAGE.dor || o.stage === STAGE.diagnostico),
    hot: active
      .filter((o) => o.stage >= STAGE.dor && o.stage <= STAGE.proposta)
      .sort((a, b) => b.stage - a.stage || b.value - a.value)
      .slice(0, 8),
    proposals: db.proposals.filter((p) => p.status === "aberta").sort((a, b) => a.date.localeCompare(b.date)),
    charges: db.payments.filter((p) => p.status === "pendente").sort((a, b) => a.date.localeCompare(b.date)),
    deliveries: db.deliveries.filter((d) => d.status !== "entregue").sort((a, b) => Number(b.critical) - Number(a.critical) || a.dueDate.localeCompare(b.dueDate)),
    pById,
    oById,
    t,
  };
}

function Row({ left, mid, right, onClick, late }: { left: string; mid?: string; right?: React.ReactNode; onClick?: () => void; late?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 border-b px-3 py-1.5 text-left text-[12.5px] last:border-0 hover:bg-accent/50">
      <span className="min-w-0 flex-1 truncate font-medium">{left}</span>
      {mid && <span className="hidden truncate text-muted-foreground sm:inline">{mid}</span>}
      <span className={late ? "num text-danger" : "num text-muted-foreground"}>{right}</span>
    </button>
  );
}

export function TodayGrid({ limit = 6 }: { limit?: number }) {
  const db = useDB();
  const d = useToday(db);
  const { openProspect } = useProspectSheet();
  const { openForm } = useForms();
  const name = (oppId: string) => d.pById.get(d.oById.get(oppId)?.prospectId ?? "")?.company ?? "—";
  const pid = (oppId: string) => d.oById.get(oppId)?.prospectId ?? "";
  const more = (n: number) => (n > limit ? <span className="text-[11px] text-muted-foreground">+{n - limit}</span> : null);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Section title={<>Oportunidades quentes <Pill tone="warning">{d.hot.length}</Pill></>}>
        {d.hot.length === 0 && <Empty>Nada quente agora.</Empty>}
        {d.hot.slice(0, limit).map((o) => (
          <Row key={o.id} left={d.pById.get(o.prospectId)?.company ?? o.title} mid={STAGES[o.stage]} right={brl(o.value)} onClick={() => openProspect(o.prospectId)} />
        ))}
      </Section>
      <Section title={<>Follow-ups pendentes <Pill tone={d.followups.length ? "danger" : "muted"}>{d.followups.length}</Pill></>} right={more(d.followups.length)}>
        {d.followups.length === 0 && <Empty>Nenhum follow-up vencido.</Empty>}
        {d.followups.slice(0, limit).map((o) => (
          <Row key={o.id} left={d.pById.get(o.prospectId)?.company ?? ""} mid={o.nextAction} right={fmtDate(o.nextActionDate)} late={o.nextActionDate < d.t} onClick={() => openProspect(o.prospectId)} />
        ))}
      </Section>
      <Section title={<>Propostas aguardando decisão <Pill tone="info">{d.proposals.length}</Pill></>} right={more(d.proposals.length)}>
        {d.proposals.length === 0 && <Empty>Nenhuma proposta aberta.</Empty>}
        {d.proposals.slice(0, limit).map((p) => (
          <Row key={p.id} left={name(p.opportunityId)} mid={`desde ${fmtDate(p.date)}`} right={brl(p.value)} onClick={() => openProspect(pid(p.opportunityId))} />
        ))}
      </Section>
      <Section title={<>Cobranças pendentes <Pill tone={d.charges.length ? "warning" : "muted"}>{d.charges.length}</Pill></>}>
        {d.charges.length === 0 && <Empty>Nenhuma cobrança pendente.</Empty>}
        {d.charges.slice(0, limit).map((p) => (
          <div key={p.id} className="flex items-center gap-2 border-b px-3 py-1.5 text-[12.5px] last:border-0">
            <button className="flex-1 truncate text-left font-medium hover:text-primary" onClick={() => openProspect(pid(p.opportunityId))}>{name(p.opportunityId)}</button>
            <span className={p.date < d.t ? "num text-danger" : "num text-muted-foreground"}>{fmtDate(p.date)}</span>
            <span className="num">{brl(p.amount)}</span>
            <button
              className="rounded-sm border border-success/40 px-1.5 text-[11px] text-success hover:bg-success/15"
              onClick={() => {
                upsert("payments", { ...p, status: "pago", date: d.t });
                toast.success(`Pagamento de ${brl(p.amount)} marcado como recebido`);
              }}
            >
              Recebido
            </button>
          </div>
        ))}
      </Section>
      <Section title={<>Entregas <Pill tone={d.deliveries.some((x) => x.critical) ? "danger" : "muted"}>{d.deliveries.length}</Pill></>} right={more(d.deliveries.length)}>
        {d.deliveries.length === 0 && <Empty>Nenhuma entrega aberta.</Empty>}
        {d.deliveries.slice(0, limit).map((x) => (
          <Row key={x.id} left={`${x.critical ? "⚠ " : ""}${name(x.opportunityId)}`} mid={x.status} right={fmtDate(x.dueDate)} late={x.dueDate < d.t} onClick={() => openForm("delivery", x as never)} />
        ))}
      </Section>
      <Section title={<>Contatos a fazer <Pill>{d.contacts.length}</Pill></>} right={more(d.contacts.length)}>
        {d.contacts.length === 0 && <Empty>Nenhum prospect aguardando abordagem.</Empty>}
        {d.contacts.slice(0, limit).map((o) => (
          <Row key={o.id} left={d.pById.get(o.prospectId)?.company ?? ""} mid={`Prioridade ${d.pById.get(o.prospectId)?.priority}`} right={STAGES[o.stage]} onClick={() => openProspect(o.prospectId)} />
        ))}
      </Section>
    </div>
  );
}

export function GoalStrip() {
  const db = useDB();
  const g = goalProgress(db);
  const rows = [
    ["Mês", g.monthly],
    ["Semana (7d)", g.weekly],
    ["Hoje", g.daily],
  ] as const;
  return (
    <Section title="Meta de caixa" right={<Link to="/metas" className="text-[11px] text-primary hover:underline">configurar</Link>}>
      <div className="space-y-2.5 p-3">
        {rows.map(([label, r]) => (
          <div key={label}>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-muted-foreground">{label}</span>
              <span className="num">
                <b>{brl(r.done)}</b> <span className="text-muted-foreground">/ {brl(r.goal)} · {pct(r.pct)}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={r.pct >= 1 ? "h-full bg-success" : "h-full bg-primary"} style={{ width: `${Math.min(100, r.pct * 100)}%` }} />
            </div>
          </div>
        ))}
        <p className="text-[11.5px] text-muted-foreground">
          Projeção do mês: <span className={g.monthly.projection >= g.monthly.goal ? "num text-success" : "num text-danger"}>{brl(g.monthly.projection)}</span>
        </p>
      </div>
    </Section>
  );
}
