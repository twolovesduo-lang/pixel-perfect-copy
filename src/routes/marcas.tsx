import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section, T, DemoTag, Empty } from "@/components/app/bits";
import { useForms } from "@/components/app/EntityForms";
import { useMetrics } from "@/state/store";
import { brl, brlh, hrs, safeDiv } from "@/domain/format";
import { STAGE } from "@/domain/types";

export const Route = createFileRoute("/marcas")({
  head: () => ({
    meta: [
      { title: "Marcas — PUB War" },
      { name: "description", content: "Marcas da PUB Holding com SKUs, torneiras, pipeline, caixa e evidências." },
      { property: "og:title", content: "Marcas — PUB War" },
      { property: "og:description", content: "Marcas da PUB Holding com SKUs, torneiras, pipeline, caixa e evidências." },
    ],
  }),
  component: Marcas,
});

function Marcas() {
  const { db, idx } = useMetrics();
  const { openForm } = useForms();
  const rows = db.brands
    .map((b) => {
      const skus = db.skus.filter((s) => s.brandId === b.id);
      const skuIds = new Set(skus.map((s) => s.id));
      const faucets = db.faucets.filter((f) => skuIds.has(f.skuId));
      const fIds = new Set(faucets.map((f) => f.id));
      const ms = faucets.map((f) => idx.faucet.get(f.id)!);
      const opps = db.opportunities.filter((o) => fIds.has(o.faucetId) && o.stage < STAGE.pagamento);
      const cash = ms.reduce((a, m) => a + m.cash, 0);
      const hours = ms.reduce((a, m) => a + m.hours, 0);
      const margin = ms.reduce((a, m) => a + m.margin, 0);
      return {
        b, skus, faucets, cash, hours, mph: safeDiv(margin, hours),
        pipeline: opps.length, pipelineValue: opps.reduce((a, o) => a + o.value, 0),
        evidences: db.evidences.filter((e) => fIds.has(e.faucetId) || skuIds.has(e.skuId)).length,
      };
    })
    .sort((a, b) => b.cash - a.cash);

  return (
    <>
      <PageHeader title="Marcas" sub={`${db.brands.length} marcas`} actions={<Button size="sm" onClick={() => openForm("brand")}><Plus className="size-3.5" /> Marca</Button>} />
      <Section title="Visão por marca">
        <div className={T.wrap}>
          <table className={T.table}>
            <thead>
              <tr>{["Marca", "SKUs", "Torneiras", "Pipeline aberto", "Caixa", "Horas", "Margem/h", "Evidências", ""].map((h) => <th key={h} className={T.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.b.id} className={T.tr + " align-top"}>
                  <td className={T.td}><div className="font-medium">{r.b.name} {r.b.demo && <DemoTag />}</div><div className="text-[11px] text-muted-foreground">{r.b.description}</div></td>
                  <td className={T.td}>
                    <div className="num">{r.skus.length}</div>
                    <div className="max-w-56 whitespace-normal text-[11px] text-muted-foreground">{r.skus.map((s) => s.name).join(", ")}</div>
                  </td>
                  <td className={T.td}>
                    <div className="num">{r.faucets.length}</div>
                    <div className="flex max-w-56 flex-col text-[11px]">
                      {r.faucets.map((f) => <Link key={f.id} to="/torneiras/$id" params={{ id: f.id }} className="truncate text-muted-foreground hover:text-primary">{f.name}</Link>)}
                    </div>
                  </td>
                  <td className={T.td + " num"}>{r.pipeline}<div className="text-[11px] text-muted-foreground">{brl(r.pipelineValue)}</div></td>
                  <td className={T.td + " num text-primary"}>{brl(r.cash)}</td>
                  <td className={T.td + " num"}>{hrs(r.hours)}</td>
                  <td className={T.td + " num"}>{brlh(r.mph)}</td>
                  <td className={T.td + " num"}>{r.evidences}</td>
                  <td className={T.td}><button className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => openForm("brand", r.b as never)}>editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>Nenhuma marca cadastrada.</Empty>}
        </div>
      </Section>
    </>
  );
}
