import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Pill, Section, Empty, DemoTag, T } from "@/components/app/bits";
import { useForms, OWNERS } from "@/components/app/EntityForms";
import { useProspectSheet } from "@/components/app/ProspectSheet";
import { remove, useDB } from "@/state/store";
import { fmtDate, hrs } from "@/domain/format";
import { ACTIVITY_TYPES } from "@/domain/types";

export const Route = createFileRoute("/atividades")({
  head: () => ({
    meta: [
      { title: "Ações comerciais — PUB War" },
      { name: "description", content: "Registro de contatos, follow-ups, reuniões, propostas, cobranças, entregas e horas." },
      { property: "og:title", content: "Ações comerciais — PUB War" },
      { property: "og:description", content: "Registro de contatos, follow-ups, reuniões, propostas, cobranças, entregas e horas." },
    ],
  }),
  component: Atividades,
});

function Atividades() {
  const db = useDB();
  const { openForm } = useForms();
  const { openProspect } = useProspectSheet();
  const [type, setType] = useState("");
  const [owner, setOwner] = useState("");
  const [q, setQ] = useState("");
  const oName = new Map(db.opportunities.map((o) => [o.id, o.title]));
  const fName = new Map(db.faucets.map((f) => [f.id, f.name]));
  const rows = db.activities
    .filter((a) => (!type || a.type === type) && (!owner || a.owner === owner) && (!q || a.description.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const totalHours = rows.reduce((a, x) => a + (x.hours || 0), 0);

  return (
    <>
      <PageHeader
        title="Ações comerciais"
        sub={`${rows.length} ações · ${hrs(totalHours)} registradas`}
        actions={
          <>
            <input className="field !w-44" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="field !w-32" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tipo</option>
              {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="field !w-32" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">Responsável</option>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <Button size="sm" variant="secondary" onClick={() => openForm("activity", { type: "horas", description: "Horas de operação" })}><Plus className="size-3.5" /> Horas</Button>
            <Button size="sm" onClick={() => openForm("activity")}><Plus className="size-3.5" /> Ação</Button>
          </>
        }
      />
      <Section title="Histórico">
        <div className={T.wrap}>
          <table className={T.table}>
            <thead>
              <tr>{["Data", "Tipo", "Resp.", "Descrição", "Oportunidade / Torneira", "Horas", ""].map((h) => <th key={h} className={T.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((a) => (
                <tr key={a.id} className={T.tr}>
                  <td className={T.td + " num text-muted-foreground"}>{fmtDate(a.date)}</td>
                  <td className={T.td}><Pill tone={a.type === "pagamento" ? "success" : a.type === "horas" ? "warning" : "muted"}>{a.type}</Pill></td>
                  <td className={T.td}>{a.owner}</td>
                  <td className={T.td + " max-w-80 truncate"}>{a.description} {a.demo && <DemoTag />}</td>
                  <td className={T.td + " max-w-64 truncate text-muted-foreground"}>
                    {a.prospectId ? <button className="hover:text-primary" onClick={() => openProspect(a.prospectId!)}>{oName.get(a.opportunityId ?? "") ?? "—"}</button> : fName.get(a.faucetId ?? "") ?? "—"}
                  </td>
                  <td className={T.td + " num text-right"}>{a.hours ? hrs(a.hours) : ""}</td>
                  <td className={T.td + " text-right"}>
                    <button className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => openForm("activity", a as never)}>editar</button>{" "}
                    <button className="text-[11px] text-muted-foreground hover:text-danger" onClick={() => confirm("Excluir ação?") && remove("activities", a.id)}>excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>Nenhuma ação registrada.</Empty>}
        </div>
      </Section>
    </>
  );
}
