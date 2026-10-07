import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Pill, DemoTag } from "@/components/app/bits";
import { useForms, OWNERS } from "@/components/app/EntityForms";
import { useProspectSheet } from "@/components/app/ProspectSheet";
import { moveOpportunity, useDB } from "@/state/store";
import { brl, fmtDate, todayISO } from "@/domain/format";
import { STAGES } from "@/domain/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — PUB War" },
      { name: "description", content: "Kanban comercial em 11 estágios, do prospect à expansão." },
      { property: "og:title", content: "Pipeline — PUB War" },
      { property: "og:description", content: "Kanban comercial em 11 estágios, do prospect à expansão." },
    ],
  }),
  component: Pipeline,
});

function Pipeline() {
  const db = useDB();
  const { openForm } = useForms();
  const { openProspect } = useProspectSheet();
  const [q, setQ] = useState("");
  const [faucet, setFaucet] = useState("");
  const [owner, setOwner] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const t = todayISO();
  const pById = new Map(db.prospects.map((p) => [p.id, p]));

  const opps = db.opportunities.filter((o) => {
    const p = pById.get(o.prospectId);
    if (faucet && o.faucetId !== faucet) return false;
    if (owner && o.owner !== owner) return false;
    if (q && !`${o.title} ${p?.company ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Pipeline"
        sub="Arraste os cards entre estágios ou use as setas. Clique para abrir o prospect."
        actions={
          <>
            <input className="field !w-48" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="field !w-52" value={faucet} onChange={(e) => setFaucet(e.target.value)}>
              <option value="">Todas as torneiras</option>
              {db.faucets.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select className="field !w-32" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">Responsável</option>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <Button size="sm" onClick={() => openForm("opportunity")}><Plus className="size-3.5" /> Oportunidade</Button>
          </>
        }
      />
      <div className="flex gap-2 overflow-x-auto pb-3">
        {STAGES.map((stage, si) => {
          const col = opps.filter((o) => o.stage === si);
          const total = col.reduce((a, o) => a + o.value, 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(si);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={() => {
                if (drag) moveOpportunity(drag, si);
                setDrag(null);
                setOver(null);
              }}
              className={cn("flex w-60 shrink-0 flex-col rounded-lg border bg-surface", over === si && "border-primary")}
            >
              <div className="border-b px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold">{si + 1}. {stage}</span>
                  <span className="num text-[11px] text-muted-foreground">{col.length}</span>
                </div>
                <div className="num text-[11px] text-muted-foreground">{brl(total)}</div>
              </div>
              <div className="flex min-h-24 flex-col gap-1.5 p-1.5">
                {col.map((o) => {
                  const p = pById.get(o.prospectId);
                  const late = o.nextActionDate && o.nextActionDate < t;
                  return (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={() => setDrag(o.id)}
                      className="panel cursor-grab p-2 text-[12px] hover:border-primary/50 active:cursor-grabbing"
                    >
                      <button className="block w-full text-left" onClick={() => openProspect(o.prospectId)}>
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-medium leading-tight">{p?.company ?? o.title}</span>
                          {p && <Pill tone={p.priority === "A" ? "success" : p.priority === "B" ? "warning" : "muted"}>{p.priority}</Pill>}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{db.faucets.find((f) => f.id === o.faucetId)?.name}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="num text-primary">{brl(o.value)}</span>
                          <span className="text-[11px] text-muted-foreground">{o.owner}</span>
                        </div>
                        {o.nextAction && (
                          <div className={cn("mt-1 truncate text-[11px]", late ? "text-danger" : "text-muted-foreground")}>
                            → {o.nextAction} {o.nextActionDate && `· ${fmtDate(o.nextActionDate)}`}
                          </div>
                        )}
                      </button>
                      <div className="mt-1 flex items-center justify-between border-t pt-1">
                        <button aria-label="Voltar estágio" disabled={si === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveOpportunity(o.id, si - 1)}><ChevronLeft className="size-4" /></button>
                        {o.demo && <DemoTag />}
                        <button aria-label="Avançar estágio" disabled={si === STAGES.length - 1} className="text-muted-foreground hover:text-primary disabled:opacity-30" onClick={() => moveOpportunity(o.id, si + 1)}><ChevronRight className="size-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
