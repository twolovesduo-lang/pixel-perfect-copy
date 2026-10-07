import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Pill, Section, Empty, DemoTag, T } from "@/components/app/bits";
import { useForms } from "@/components/app/EntityForms";
import { useProspectSheet } from "@/components/app/ProspectSheet";
import { useMetrics } from "@/state/store";
import { STAGES, PRIORITIES } from "@/domain/types";

export const Route = createFileRoute("/prospects")({
  head: () => ({
    meta: [
      { title: "Prospects — PUB War" },
      { name: "description", content: "Base de prospects com decisor, sinal de dor, prioridade e estágio." },
      { property: "og:title", content: "Prospects — PUB War" },
      { property: "og:description", content: "Base de prospects com decisor, sinal de dor, prioridade e estágio." },
    ],
  }),
  component: Prospects,
});

function Prospects() {
  const { db, idx } = useMetrics();
  const { openForm } = useForms();
  const { openProspect } = useProspectSheet();
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("");
  const [faucet, setFaucet] = useState("");
  const [stage, setStage] = useState("");
  const fName = new Map(db.faucets.map((f) => [f.id, f.name]));
  const rows = db.prospects.filter((p) => {
    const s = idx.prospectStage.get(p.id) ?? 0;
    if (prio && p.priority !== prio) return false;
    if (faucet && p.faucetId !== faucet) return false;
    if (stage !== "" && s !== Number(stage)) return false;
    if (q && !`${p.company} ${p.decisionMaker} ${p.segment} ${p.painSignal}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Prospects"
        sub={`${rows.length} de ${db.prospects.length}`}
        actions={
          <>
            <input className="field !w-48" placeholder="Buscar empresa, decisor…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="field !w-24" value={prio} onChange={(e) => setPrio(e.target.value)}>
              <option value="">Prior.</option>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="field !w-40" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">Estágio</option>
              {STAGES.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
            <select className="field !w-52" value={faucet} onChange={(e) => setFaucet(e.target.value)}>
              <option value="">Todas as torneiras</option>
              {db.faucets.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <Button size="sm" onClick={() => openForm("prospect")}><Plus className="size-3.5" /> Prospect</Button>
          </>
        }
      />
      <Section title="Lista">
        <div className={T.wrap}>
          <table className={T.table}>
            <thead>
              <tr>
                {["", "Empresa", "Decisor", "Contato", "Sinal de dor", "Torneira", "Estágio", "Próxima ação"].map((h) => <th key={h} className={T.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const s = idx.prospectStage.get(p.id) ?? 0;
                const next = db.opportunities.find((o) => o.prospectId === p.id);
                return (
                  <tr key={p.id} className={T.tr + " cursor-pointer"} onClick={() => openProspect(p.id)}>
                    <td className={T.td}><Pill tone={p.priority === "A" ? "success" : p.priority === "B" ? "warning" : "muted"}>{p.priority}</Pill></td>
                    <td className={T.td + " font-medium"}>{p.company} {p.demo && <DemoTag />}<div className="text-[11px] font-normal text-muted-foreground">{p.segment}</div></td>
                    <td className={T.td}>{p.decisionMaker}<div className="text-[11px] text-muted-foreground">{p.role}</div></td>
                    <td className={T.td + " text-muted-foreground"}>{p.contact}</td>
                    <td className={T.td + " max-w-56 truncate"}>{p.painSignal}</td>
                    <td className={T.td + " max-w-48 truncate text-muted-foreground"}>{fName.get(p.faucetId)}</td>
                    <td className={T.td}><Pill tone="info">{STAGES[s]}</Pill></td>
                    <td className={T.td + " max-w-48 truncate text-muted-foreground"}>{p.nextAction || next?.nextAction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>Nenhum prospect com esses filtros.</Empty>}
        </div>
      </Section>
    </>
  );
}
