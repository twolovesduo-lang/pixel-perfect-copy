import { createContext, useContext, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useForms } from "./EntityForms";
import { DemoTag, Pill, Empty } from "./bits";
import { moveOpportunity, useMetrics } from "@/state/store";
import { brl, fmtDate } from "@/domain/format";
import { STAGES, type ID } from "@/domain/types";

const Ctx = createContext<{ openProspect: (id: ID) => void }>({ openProspect: () => {} });
export const useProspectSheet = () => useContext(Ctx);

export function ProspectSheetProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<ID | null>(null);
  return (
    <Ctx.Provider value={{ openProspect: setId }}>
      {children}
      <Sheet open={!!id} onOpenChange={(o) => !o && setId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{id && <ProspectDetail id={id} />}</SheetContent>
      </Sheet>
    </Ctx.Provider>
  );
}

function ProspectDetail({ id }: { id: ID }) {
  const { db, idx } = useMetrics();
  const { openForm } = useForms();
  const p = db.prospects.find((x) => x.id === id);
  if (!p) return <Empty>Prospect não encontrado.</Empty>;
  const faucet = db.faucets.find((f) => f.id === p.faucetId);
  const opps = db.opportunities.filter((o) => o.prospectId === id);
  const oppIds = new Set(opps.map((o) => o.id));
  const stage = idx.prospectStage.get(id) ?? 0;
  const timeline = [
    ...db.activities.filter((a) => a.prospectId === id).map((a) => ({ id: a.id, date: a.date, kind: a.type, text: a.description, who: a.owner, extra: a.hours ? `${a.hours}h` : "" })),
    ...db.proposals.filter((x) => oppIds.has(x.opportunityId)).map((x) => ({ id: x.id, date: x.date, kind: "proposta", text: `Proposta ${brl(x.value)} — ${x.status}`, who: "", extra: "" })),
    ...db.payments.filter((x) => oppIds.has(x.opportunityId)).map((x) => ({ id: x.id, date: x.date, kind: "pagamento", text: `${brl(x.amount)} — ${x.status}`, who: "", extra: "" })),
    ...db.deliveries.filter((x) => oppIds.has(x.opportunityId)).map((x) => ({ id: x.id, date: x.dueDate, kind: "entrega", text: `${x.title} — ${x.status}`, who: "", extra: x.critical ? "crítica" : "" })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const first = opps[0];
  const ctx = first ? { opportunityId: first.id } : {};

  const info: [string, string][] = [
    ["Segmento", p.segment], ["Decisor", p.decisionMaker], ["Cargo", p.role], ["Contato", p.contact],
    ["Site", p.site], ["Instagram", p.instagram], ["Sinal de dor", p.painSignal], ["Próxima ação", p.nextAction || first?.nextAction || ""],
  ];

  return (
    <div className="space-y-4">
      <SheetHeader className="space-y-1 p-0">
        <div className="flex items-center gap-2">
          <Pill tone={p.priority === "A" ? "success" : p.priority === "B" ? "warning" : "muted"}>{p.priority}</Pill>
          <Pill tone="info">{STAGES[stage]}</Pill>
          {p.demo && <DemoTag />}
        </div>
        <SheetTitle className="text-lg">{p.company}</SheetTitle>
        <p className="text-xs text-muted-foreground">Torneira: {faucet?.name ?? "—"}</p>
      </SheetHeader>

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="secondary" onClick={() => openForm("prospect", p as never)}>Editar</Button>
        <Button size="sm" variant="secondary" onClick={() => openForm("activity", ctx)}>+ Atividade</Button>
        <Button size="sm" variant="secondary" onClick={() => openForm("proposal", { ...ctx, value: first?.value })}>+ Proposta</Button>
        <Button size="sm" onClick={() => openForm("payment", { ...ctx, amount: first?.value })}>+ Pagamento</Button>
        <Button size="sm" variant="secondary" onClick={() => openForm("delivery", ctx)}>+ Entrega</Button>
        <Button size="sm" variant="secondary" onClick={() => openForm("evidence", { prospectId: p.id, faucetId: p.faucetId, skuId: faucet?.skuId })}>+ Evidência</Button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
        {info.map(([k, v]) => (
          <div key={k}>
            <dt className="label-xs">{k}</dt>
            <dd className="truncate">{v || "—"}</dd>
          </div>
        ))}
      </dl>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="label-xs !text-foreground">Oportunidades</h3>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => openForm("opportunity", { prospectId: p.id, faucetId: p.faucetId, title: p.company })}>+ Nova</Button>
        </div>
        {opps.length === 0 && <Empty>Nenhuma oportunidade.</Empty>}
        <div className="space-y-2">
          {opps.map((o) => (
            <div key={o.id} className="panel space-y-2 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <button className="text-left text-[13px] font-medium hover:text-primary" onClick={() => openForm("opportunity", o as never)}>{o.title}</button>
                <span className="num text-[13px] text-primary">{brl(o.value)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <select className="field !h-7 !w-auto" value={o.stage} onChange={(e) => moveOpportunity(o.id, Number(e.target.value))} aria-label="Mover estágio">
                  {STAGES.map((s, i) => <option key={s} value={i}>{i + 1}. {s}</option>)}
                </select>
                <span>Resp.: {o.owner}</span>
                <span>Próx.: {o.nextAction || "—"} {o.nextActionDate && `(${fmtDate(o.nextActionDate)})`}</span>
              </div>
              {o.notes && <p className="text-xs text-muted-foreground">{o.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="label-xs mb-1.5 !text-foreground">Histórico</h3>
        {timeline.length === 0 && <Empty>Sem histórico.</Empty>}
        <ol className="space-y-1">
          {timeline.map((t) => (
            <li key={t.id} className="flex gap-2 border-b py-1 text-xs">
              <span className="num w-12 shrink-0 text-muted-foreground">{fmtDate(t.date)}</span>
              <Pill className="w-20 justify-center">{t.kind}</Pill>
              <span className="flex-1">{t.text}</span>
              <span className="text-muted-foreground">{[t.who, t.extra].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
