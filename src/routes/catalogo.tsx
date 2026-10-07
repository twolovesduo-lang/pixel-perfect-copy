import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Pill, Section, Empty, DemoTag, statusTone, ScoreBadge, T } from "@/components/app/bits";
import { useForms } from "@/components/app/EntityForms";
import { useMetrics } from "@/state/store";
import { scoreLabel } from "@/domain/metrics";
import { brl, hrs } from "@/domain/format";
import { SKU_STATUSES } from "@/domain/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo de SKUs — PUB War" },
      { name: "description", content: "Todas as ofertas da holding com ICP, ticket, status, score, caixa e margem." },
      { property: "og:title", content: "Catálogo de SKUs — PUB War" },
      { property: "og:description", content: "Todas as ofertas da holding com ICP, ticket, status, score, caixa e margem." },
    ],
  }),
  component: Catalogo,
});

type SortK = "name" | "score" | "cash" | "margin" | "hours" | "testTicket";

function Catalogo() {
  const { db, idx } = useMetrics();
  const { openForm } = useForms();
  const [f, setF] = useState({ q: "", brand: "", status: "", category: "", minScore: "", rec: "" });
  const [sort, setSort] = useState<SortK>("cash");
  const bName = new Map(db.brands.map((b) => [b.id, b.name]));
  const categories = [...new Set(db.skus.map((s) => s.category))].sort();

  const rows = useMemo(() => {
    return db.skus
      .map((s) => {
        const ms = db.faucets.filter((x) => x.skuId === s.id).map((x) => idx.faucet.get(x.id)!);
        const cash = ms.reduce((a, m) => a + m.cash, 0);
        const hours = ms.reduce((a, m) => a + m.hours, 0);
        const margin = ms.reduce((a, m) => a + m.margin, 0);
        const best = ms.reduce<(typeof ms)[number] | null>((b, m) => (!b || m.score.total > b.score.total ? m : b), null);
        return { s, cash, hours, margin, score: best?.score ?? null, faucets: ms.length };
      })
      .filter(({ s, score }) =>
        (!f.q || `${s.name} ${s.problem} ${s.icp}`.toLowerCase().includes(f.q.toLowerCase())) &&
        (!f.brand || s.brandId === f.brand) && (!f.status || s.status === f.status) && (!f.category || s.category === f.category) &&
        (!f.minScore || (score?.total ?? 0) >= Number(f.minScore)) && (!f.rec || String(s.recurrence) === f.rec),
      )
      .sort((a, b) => {
        if (sort === "name") return a.s.name.localeCompare(b.s.name);
        if (sort === "score") return (b.score?.total ?? -1) - (a.score?.total ?? -1);
        if (sort === "testTicket") return b.s.testTicket - a.s.testTicket;
        return b[sort] - a[sort];
      });
  }, [db, idx, f, sort]);

  const th = (k: SortK, label: string, right = true) => (
    <th className={cn(T.th, T.thBtn, right && "text-right", sort === k && "!text-primary")} onClick={() => setSort(k)}>{label}{sort === k && " ↓"}</th>
  );

  return (
    <>
      <PageHeader
        title="Catálogo"
        sub={`${rows.length} de ${db.skus.length} SKUs · caixa, horas e score vêm das torneiras do SKU`}
        actions={<Button size="sm" onClick={() => openForm("sku")}><Plus className="size-3.5" /> SKU</Button>}
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <input className="field !w-52" placeholder="Buscar nome, problema, ICP…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select className="field !w-40" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}>
          <option value="">Marca</option>{db.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="field !w-36" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Status</option>{SKU_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="field !w-40" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option value="">Categoria</option>{categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field !w-36" value={f.minScore} onChange={(e) => setF({ ...f, minScore: e.target.value })}>
          <option value="">Score mín.</option>{[3, 5, 7, 9].map((n) => <option key={n} value={n}>≥ {n} ({scoreLabel(n)})</option>)}
        </select>
        <select className="field !w-36" value={f.rec} onChange={(e) => setF({ ...f, rec: e.target.value })}>
          <option value="">Recorrência</option><option value="true">Recorrente</option><option value="false">Não recorrente</option>
        </select>
      </div>
      <Section title="SKUs">
        <div className={T.wrap}>
          <table className={T.table}>
            <thead>
              <tr>
                <th className={T.th}>Marca</th>
                {th("name", "SKU", false)}
                <th className={T.th}>Status</th>
                <th className={T.th}>ICP / Problema</th>
                {th("testTicket", "Ticket")}
                <th className={T.th}>Cobrança · Canal</th>
                <th className={T.th + " text-right"}>Cap.</th>
                {th("cash", "Caixa")}
                {th("hours", "Horas")}
                {th("margin", "Margem")}
                <th className={T.th}>Rec.</th>
                {th("score", "Score", false)}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, cash, hours, margin, score }) => (
                <tr key={s.id} className={T.tr + " cursor-pointer"} onClick={() => openForm("sku", s as never)} title="Clique para editar">
                  <td className={T.td + " text-muted-foreground"}>{bName.get(s.brandId)}</td>
                  <td className={T.td + " font-medium"}>{s.name} {s.demo && <DemoTag />}<div className="text-[11px] font-normal text-muted-foreground">{s.category}</div></td>
                  <td className={T.td}><Pill tone={statusTone(s.status)}>{s.status}</Pill></td>
                  <td className={T.td + " max-w-64"}><div className="truncate">{s.icp}</div><div className="truncate text-[11px] text-muted-foreground">{s.problem}</div></td>
                  <td className={T.td + " num text-right"}>{brl(s.testTicket)}</td>
                  <td className={T.td + " text-muted-foreground"}>{s.billingModel}<div className="text-[11px]">{s.channel}</div></td>
                  <td className={T.td + " num text-right"}>{s.capacity}</td>
                  <td className={T.td + " num text-right text-primary"}>{brl(cash)}</td>
                  <td className={T.td + " num text-right"}>{hrs(hours)}</td>
                  <td className={T.td + " num text-right"}>{brl(margin)}<div className="text-[11px] text-muted-foreground">{s.marginPct}%</div></td>
                  <td className={T.td}>{s.recurrence ? <Pill tone="success">sim</Pill> : <span className="text-muted-foreground">—</span>}</td>
                  <td className={T.td}>{score ? <ScoreBadge score={score} /> : <span className="text-[11px] text-muted-foreground">sem torneira</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>Nenhum SKU com esses filtros.</Empty>}
        </div>
      </Section>
    </>
  );
}
