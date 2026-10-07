import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Section, Empty, DemoTag } from "@/components/app/bits";
import { TodayGrid } from "@/components/app/today";
import { OWNERS } from "@/components/app/EntityForms";
import { upsert, remove, useDB } from "@/state/store";
import { fmtDate, todayISO } from "@/domain/format";

export const Route = createFileRoute("/hoje")({
  head: () => ({
    meta: [
      { title: "Hoje — PUB War" },
      { name: "description", content: "Contatos, follow-ups, propostas, cobranças e entregas do dia." },
      { property: "og:title", content: "Hoje — PUB War" },
      { property: "og:description", content: "Contatos, follow-ups, propostas, cobranças e entregas do dia." },
    ],
  }),
  component: Hoje,
});

function Hoje() {
  const db = useDB();
  const [text, setText] = useState("");
  const [owner, setOwner] = useState<string>("Ana");
  const logs = [...db.dailyLogs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader title="Hoje" sub={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} />
      <Section title="O que foi feito hoje que aumentou a probabilidade de entrar dinheiro?" className="mb-3">
        <form
          className="space-y-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) { toast.error("Escreva o que foi feito."); return; }
            upsert("dailyLogs", { date: todayISO(), owner, text: text.trim() });
            setText("");
            toast.success("Registro diário salvo");
          }}
        >
          <textarea className="field !h-20 py-2" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Enviei 2 propostas, cobrei 1 pagamento, agendei 3 diagnósticos…" />
          <div className="flex items-center justify-end gap-2">
            <select className="field !w-32" value={owner} onChange={(e) => setOwner(e.target.value)}>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <Button size="sm" type="submit">Salvar no histórico</Button>
          </div>
        </form>
        <div className="max-h-56 overflow-y-auto border-t">
          {logs.length === 0 && <Empty>Nenhum registro ainda.</Empty>}
          {logs.map((l) => (
            <div key={l.id} className="group flex gap-3 border-b px-3 py-1.5 text-[12.5px]">
              <span className="num w-12 shrink-0 text-muted-foreground">{fmtDate(l.date)}</span>
              <span className="w-12 shrink-0 text-muted-foreground">{l.owner}</span>
              <span className="flex-1">{l.text} {l.demo && <DemoTag />}</span>
              <button className="text-[11px] text-muted-foreground opacity-0 hover:text-danger group-hover:opacity-100" onClick={() => remove("dailyLogs", l.id)}>excluir</button>
            </div>
          ))}
        </div>
      </Section>
      <TodayGrid limit={12} />
    </>
  );
}
