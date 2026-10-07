import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Pill, Empty, DemoTag } from "@/components/app/bits";
import { useForms } from "@/components/app/EntityForms";
import { useProspectSheet } from "@/components/app/ProspectSheet";
import { remove, useDB } from "@/state/store";
import { fmtDate } from "@/domain/format";
import { EVIDENCE_TYPES } from "@/domain/types";

export const Route = createFileRoute("/evidencias")({
  head: () => ({
    meta: [
      { title: "Evidências e Cases — PUB War" },
      { name: "description", content: "Pagamentos, resultados, depoimentos e cases ligados a clientes, SKUs e torneiras." },
      { property: "og:title", content: "Evidências e Cases — PUB War" },
      { property: "og:description", content: "Pagamentos, resultados, depoimentos e cases ligados a clientes, SKUs e torneiras." },
    ],
  }),
  component: Evidencias,
});

function Evidencias() {
  const db = useDB();
  const { openForm } = useForms();
  const { openProspect } = useProspectSheet();
  const [type, setType] = useState("");
  const pName = new Map(db.prospects.map((p) => [p.id, p.company]));
  const sName = new Map(db.skus.map((s) => [s.id, s.name]));
  const fName = new Map(db.faucets.map((f) => [f.id, f.name]));
  const dName = new Map(db.deliveries.map((d) => [d.id, d.title]));
  const rows = db.evidences.filter((e) => !type || e.type === type).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeader
        title="Evidências"
        sub={`${rows.length} evidências`}
        actions={
          <>
            <select className="field !w-40" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos os tipos</option>
              {EVIDENCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <Button size="sm" onClick={() => openForm("evidence")}><Plus className="size-3.5" /> Evidência</Button>
          </>
        }
      />
      {rows.length === 0 && <div className="panel"><Empty>Nenhuma evidência registrada. Evidência é o que transforma uma torneira em máquina.</Empty></div>}
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((e) => (
          <article key={e.id} className="panel space-y-2 p-3 text-[12.5px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5"><Pill tone={e.type === "pagamento" ? "success" : e.type === "aprendizado" ? "warning" : "info"}>{e.type}</Pill>{e.demo && <DemoTag />}</div>
              <span className="num text-muted-foreground">{fmtDate(e.date)}</span>
            </div>
            <p className="font-medium">{e.result}</p>
            {e.numbers && <p className="num text-primary">{e.numbers}</p>}
            {e.testimonial && <blockquote className="border-l-2 border-primary pl-2 italic text-muted-foreground">{e.testimonial}</blockquote>}
            <dl className="grid grid-cols-2 gap-1 text-[11.5px]">
              <div><dt className="label-xs">Cliente</dt><dd><button className="hover:text-primary" onClick={() => openProspect(e.prospectId)}>{pName.get(e.prospectId) ?? "—"}</button></dd></div>
              <div><dt className="label-xs">SKU</dt><dd className="truncate">{sName.get(e.skuId) ?? "—"}</dd></div>
              <div><dt className="label-xs">Torneira</dt><dd className="truncate">{fName.get(e.faucetId) ?? "—"}</dd></div>
              <div><dt className="label-xs">Entrega</dt><dd className="truncate">{dName.get(e.deliveryId ?? "") ?? "—"}</dd></div>
            </dl>
            <div className="flex items-center justify-between border-t pt-1.5 text-[11px]">
              {e.docUrl ? <a href={e.docUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Documentação ↗</a> : <span className="text-muted-foreground">Sem documentação</span>}
              <span className="space-x-2">
                <button className="text-muted-foreground hover:text-foreground" onClick={() => openForm("evidence", e as never)}>editar</button>
                <button className="text-muted-foreground hover:text-danger" onClick={() => confirm("Excluir evidência?") && remove("evidences", e.id)}>excluir</button>
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
