import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Pill, ScoreBadge, tierTone, Empty } from "@/components/app/bits";
import { DecisionSelect } from "@/components/app/DecisionSelect";
import { useMetrics } from "@/state/store";
import { allocate, TIERS } from "@/domain/metrics";
import { brl, brlh, hrs } from "@/domain/format";

export const Route = createFileRoute("/energia")({
  head: () => ({
    meta: [
      { title: "Alocação de Energia — PUB War" },
      { name: "description", content: "Recomendação de onde concentrar horas com base em margem, conversão, capacidade e evidência." },
      { property: "og:title", content: "Alocação de Energia — PUB War" },
      { property: "og:description", content: "Recomendação de onde concentrar horas com base em margem, conversão, capacidade e evidência." },
    ],
  }),
  component: Energia,
});

function Energia() {
  const { db, idx } = useMetrics();
  const items = db.faucets.map((f) => {
    const m = idx.faucet.get(f.id)!;
    return { f, m, a: allocate(f, m) };
  });

  return (
    <>
      <PageHeader title="Alocação de Energia" sub="Recomendação automática. Não promete resultado: indica onde a evidência atual sugere colocar horas." />
      <div className="space-y-3">
        {TIERS.map((tier) => {
          const list = items.filter((i) => i.a.tier === tier).sort((x, y) => y.a.energyValue - x.a.energyValue);
          return (
            <section key={tier} className="panel">
              <header className="flex items-center gap-2 border-b px-3 py-2">
                <Pill tone={tierTone(tier)}>{tier}</Pill>
                <span className="text-[11px] text-muted-foreground">{list.length} torneira(s)</span>
              </header>
              {list.length === 0 && <Empty>Nenhuma torneira neste nível.</Empty>}
              <div className="divide-y">
                {list.map(({ f, m, a }) => (
                  <div key={f.id} className="grid items-center gap-2 px-3 py-2 md:grid-cols-[1.4fr_130px_1fr_1.6fr_auto]">
                    <Link to="/torneiras/$id" params={{ id: f.id }} className="font-medium hover:text-primary">{f.name}</Link>
                    <div className="num text-lg font-semibold text-primary">{brlh(m.marginPerHour)}<div className="text-[10.5px] font-normal text-muted-foreground">margem/h · caixa/h {brlh(m.cashPerHour)}</div></div>
                    <ScoreBadge score={m.score} />
                    <div className="text-[11.5px] text-muted-foreground">
                      {a.reasons.join(" · ")}
                      <div>Caixa {brl(m.cash)} · {hrs(m.hours)} · cap. {m.activeDeliveries}/{m.capacity}</div>
                    </div>
                    <DecisionSelect id={f.id} value={f.decision} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-3 text-[11.5px] text-muted-foreground">
        Regra: valor de energia = margem/hora × (0,7 + 0,3 × fechamento) × (1,1 com evidência / 0,9 sem). ≥R$200 máxima, ≥R$100 alta, ≥R$45 testar, abaixo reduzir. Sem caixa e &lt;8h = testar; sem caixa, ≥8h e resposta &lt;5% = pausar. Capacidade de entrega lotada rebaixa máxima para alta.
      </p>
    </>
  );
}
