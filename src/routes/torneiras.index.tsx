import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Pill, ScoreBadge, DemoTag, tierTone, Empty } from "@/components/app/bits";
import { DecisionSelect } from "@/components/app/DecisionSelect";
import { useForms } from "@/components/app/EntityForms";
import { useMetrics } from "@/state/store";
import { allocate, type FaucetMetrics } from "@/domain/metrics";
import { brl, brlh, hrs } from "@/domain/format";

export const Route = createFileRoute("/torneiras/")({
  head: () => ({
    meta: [
      { title: "Torneiras comerciais — PUB War" },
      { name: "description", content: "Ofertas em distribuição com funil, caixa, horas, score e decisão." },
      { property: "og:title", content: "Torneiras comerciais — PUB War" },
      { property: "og:description", content: "Ofertas em distribuição com funil, caixa, horas, score e decisão." },
    ],
  }),
  component: Torneiras,
});

const SORTS: Record<string, (m: FaucetMetrics) => number> = {
  "Margem/hora": (m) => m.marginPerHour,
  "Caixa/hora": (m) => m.cashPerHour,
  Score: (m) => m.score.total,
  Caixa: (m) => m.cash,
  Horas: (m) => m.hours,
};

function Torneiras() {
  const { db, idx } = useMetrics();
  const { openForm } = useForms();
  const [sort, setSort] = useState("Margem/hora");
  const skuById = new Map(db.skus.map((s) => [s.id, s]));
  const bName = new Map(db.brands.map((b) => [b.id, b.name]));
  const rows = db.faucets
    .map((f) => ({ f, m: idx.faucet.get(f.id)! }))
    .sort((a, b) => SORTS[sort]!(b.m) - SORTS[sort]!(a.m));
  const maxMph = Math.max(1, ...rows.map((r) => r.m.marginPerHour));

  return (
    <>
      <PageHeader
        title="Torneiras"
        sub="Cada torneira = uma oferta em distribuição. A barra mostra margem/hora relativa: quanto maior, mais merece energia."
        actions={
          <>
            <select className="field !w-36" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
              {Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}
            </select>
            <Button size="sm" onClick={() => openForm("faucet")}><Plus className="size-3.5" /> Torneira</Button>
          </>
        }
      />
      {rows.length === 0 && <Empty>Nenhuma torneira. Crie um SKU e depois uma torneira.</Empty>}
      <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map(({ f, m }) => {
          const sku = skuById.get(f.skuId);
          const a = allocate(f, m);
          const funnel: [string, number][] = [
            ["Prosp", m.prospects], ["Cont", m.contacts], ["Resp", m.responses], ["Conv", m.conversations],
            ["Diag", m.diagnostics], ["Prop", m.proposals], ["Pag", m.payments],
          ];
          const maxF = Math.max(1, m.prospects);
          return (
            <div key={f.id} className="panel p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to="/torneiras/$id" params={{ id: f.id }} className="block truncate font-semibold hover:text-primary">{f.name}</Link>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {bName.get(sku?.brandId ?? "")} · {sku?.name} · {f.channel} {f.demo && <DemoTag />}
                  </div>
                </div>
                <Pill tone={tierTone(a.tier)}>{a.tier}</Pill>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${(m.marginPerHour / maxMph) * 100}%` }} />
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {funnel.map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="mx-auto flex h-8 w-full items-end justify-center">
                      <div className="w-3/5 rounded-t-sm bg-info/60" style={{ height: `${Math.max(4, (v / maxF) * 100)}%` }} />
                    </div>
                    <div className="num text-[12px] font-semibold">{v}</div>
                    <div className="text-[9.5px] uppercase text-muted-foreground">{k}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 border-t pt-2 text-[11px]">
                <div><div className="label-xs">Caixa</div><div className="num text-[13px] text-primary">{brl(m.cash)}</div></div>
                <div><div className="label-xs">Horas</div><div className="num text-[13px]">{hrs(m.hours)}</div></div>
                <div><div className="label-xs">Margem</div><div className="num text-[13px]">{brl(m.margin)}</div></div>
                <div><div className="label-xs">Marg./h</div><div className="num text-[13px] font-semibold">{brlh(m.marginPerHour)}</div></div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <ScoreBadge score={m.score} />
                <DecisionSelect id={f.id} value={f.decision} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
