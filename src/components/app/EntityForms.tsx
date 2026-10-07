import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FormDialog, type Field } from "./FormDialog";
import { moveOpportunity, store, upsert, useDB } from "@/state/store";
import { todayISO } from "@/domain/format";
import {
  ACTIVITY_TYPES, DECISIONS, EVIDENCE_TYPES, PRIORITIES, SKU_STATUSES, STAGE, STAGES, type DB, type CollectionKey,
} from "@/domain/types";

export type FormKind =
  | "brand" | "sku" | "faucet" | "prospect" | "opportunity" | "activity" | "proposal" | "payment" | "delivery" | "evidence";

const COLLECTION: Record<FormKind, CollectionKey> = {
  brand: "brands", sku: "skus", faucet: "faucets", prospect: "prospects", opportunity: "opportunities",
  activity: "activities", proposal: "proposals", payment: "payments", delivery: "deliveries", evidence: "evidences",
};
const LABEL: Record<FormKind, string> = {
  brand: "marca", sku: "SKU", faucet: "torneira", prospect: "prospect", opportunity: "oportunidade",
  activity: "atividade", proposal: "proposta", payment: "pagamento", delivery: "entrega", evidence: "evidência",
};
export const OWNERS = ["Ana", "Bruno", "Carla"];

const opts = (arr: readonly string[]) => arr.map((v) => ({ value: v, label: v }));

function fieldsFor(kind: FormKind, db: DB): Field[] {
  const brands = db.brands.map((b) => ({ value: b.id, label: b.name }));
  const skus = db.skus.map((s) => ({ value: s.id, label: s.name }));
  const faucets = db.faucets.map((f) => ({ value: f.id, label: f.name }));
  const prospects = db.prospects.map((p) => ({ value: p.id, label: p.company }));
  const opps = db.opportunities.map((o) => ({ value: o.id, label: o.title }));
  const owners = { name: "owner", label: "Responsável", type: "select" as const, options: opts(OWNERS), required: true };
  switch (kind) {
    case "brand":
      return [{ name: "name", label: "Nome", required: true }, { name: "description", label: "Descrição", wide: true }];
    case "sku":
      return [
        { name: "brandId", label: "Marca", type: "select", options: brands, required: true },
        { name: "name", label: "Nome", required: true },
        { name: "category", label: "Categoria", required: true },
        { name: "status", label: "Status", type: "select", options: opts(SKU_STATUSES), required: true },
        { name: "problem", label: "Problema", wide: true },
        { name: "icp", label: "ICP", wide: true },
        { name: "testTicket", label: "Ticket de teste (R$)", type: "number", required: true },
        { name: "billingModel", label: "Modelo de cobrança" },
        { name: "channel", label: "Canal" },
        { name: "capacity", label: "Capacidade (entregas simultâneas)", type: "number" },
        { name: "marginPct", label: "Margem bruta (%)", type: "number", required: true },
        { name: "recurrence", label: "Recorrente", type: "checkbox" },
      ];
    case "faucet":
      return [
        { name: "name", label: "Nome da torneira", required: true, wide: true },
        { name: "skuId", label: "SKU", type: "select", options: skus, required: true },
        { name: "decision", label: "Decisão", type: "select", options: opts(DECISIONS), required: true },
        { name: "icp", label: "ICP" },
        { name: "channel", label: "Canal" },
        { name: "notes", label: "Observações", type: "textarea" },
      ];
    case "prospect":
      return [
        { name: "company", label: "Empresa", required: true },
        { name: "faucetId", label: "Torneira", type: "select", options: faucets, required: true },
        { name: "segment", label: "Segmento" },
        { name: "priority", label: "Prioridade", type: "select", options: opts(PRIORITIES), required: true },
        { name: "decisionMaker", label: "Decisor" },
        { name: "role", label: "Cargo" },
        { name: "contact", label: "Contato" },
        { name: "site", label: "Site" },
        { name: "instagram", label: "Instagram" },
        { name: "painSignal", label: "Sinal de dor" },
        { name: "nextAction", label: "Próxima ação", wide: true },
        { name: "notes", label: "Observações", type: "textarea" },
      ];
    case "opportunity":
      return [
        { name: "title", label: "Título", required: true, wide: true },
        { name: "prospectId", label: "Prospect", type: "select", options: prospects, required: true },
        { name: "stage", label: "Estágio", type: "select", options: STAGES.map((s, i) => ({ value: String(i), label: `${i + 1}. ${s}` })), required: true },
        owners,
        { name: "value", label: "Valor (R$)", type: "number" },
        { name: "nextAction", label: "Próxima ação" },
        { name: "nextActionDate", label: "Data próxima ação", type: "date" },
        { name: "notes", label: "Observações", type: "textarea" },
      ];
    case "activity":
      return [
        { name: "type", label: "Tipo", type: "select", options: opts(ACTIVITY_TYPES), required: true },
        { name: "date", label: "Data", type: "date", required: true },
        owners,
        { name: "hours", label: "Horas investidas", type: "number" },
        { name: "opportunityId", label: "Oportunidade", type: "select", options: opps, wide: true },
        { name: "faucetId", label: "Torneira (se sem oportunidade)", type: "select", options: faucets, wide: true },
        { name: "description", label: "Descrição", type: "textarea", required: true },
      ];
    case "proposal":
      return [
        { name: "opportunityId", label: "Oportunidade", type: "select", options: opps, required: true, wide: true },
        { name: "value", label: "Valor (R$)", type: "number", required: true },
        { name: "date", label: "Data", type: "date", required: true },
        { name: "status", label: "Status", type: "select", options: opts(["aberta", "aceita", "recusada"]), required: true },
        { name: "notes", label: "Observações", type: "textarea" },
      ];
    case "payment":
      return [
        { name: "opportunityId", label: "Oportunidade", type: "select", options: opps, required: true, wide: true },
        { name: "amount", label: "Valor (R$)", type: "number", required: true },
        { name: "date", label: "Data (pagamento ou vencimento)", type: "date", required: true },
        { name: "status", label: "Status", type: "select", options: opts(["pago", "pendente"]), required: true },
        { name: "method", label: "Forma" },
      ];
    case "delivery":
      return [
        { name: "opportunityId", label: "Oportunidade", type: "select", options: opps, required: true, wide: true },
        { name: "title", label: "Entrega", required: true },
        { name: "dueDate", label: "Prazo", type: "date", required: true },
        { name: "status", label: "Status", type: "select", options: opts(["pendente", "em andamento", "entregue"]), required: true },
        { name: "critical", label: "Crítica", type: "checkbox" },
      ];
    case "evidence":
      return [
        { name: "type", label: "Tipo", type: "select", options: opts(EVIDENCE_TYPES), required: true },
        { name: "date", label: "Data", type: "date", required: true },
        { name: "prospectId", label: "Cliente", type: "select", options: prospects, required: true },
        { name: "faucetId", label: "Torneira", type: "select", options: faucets, required: true },
        { name: "skuId", label: "SKU", type: "select", options: skus, required: true },
        { name: "deliveryId", label: "Entrega", type: "select", options: db.deliveries.map((d) => ({ value: d.id, label: d.title })) },
        { name: "result", label: "Resultado", wide: true, required: true },
        { name: "numbers", label: "Números" },
        { name: "docUrl", label: "Documentação (link)" },
        { name: "testimonial", label: "Depoimento", type: "textarea" },
      ];
  }
}

function defaults(kind: FormKind): Record<string, unknown> {
  const t = todayISO();
  return ({
    sku: { status: "VALIDAR", capacity: 3, marginPct: 50, recurrence: false },
    faucet: { decision: "MANTER" },
    prospect: { priority: "B" },
    opportunity: { stage: "0", owner: "Ana", value: 0, nextActionDate: t },
    activity: { type: "contato", date: t, owner: "Ana", hours: 0 },
    proposal: { date: t, status: "aberta" },
    payment: { date: t, status: "pago", method: "PIX" },
    delivery: { dueDate: t, status: "pendente", critical: false },
    evidence: { type: "resultado", date: t },
  } as Record<string, Record<string, unknown>>)[kind] ?? {};
}

function afterSave(kind: FormKind, v: any, isNew: boolean) {
  const db = store.get()!;
  const opp = v.opportunityId ? db.opportunities.find((o) => o.id === v.opportunityId) : undefined;
  if (kind === "prospect" && isNew) {
    const f = db.faucets.find((x) => x.id === v.faucetId);
    const sku = db.skus.find((s) => s.id === f?.skuId);
    upsert("opportunities", {
      prospectId: v.id as string, faucetId: v.faucetId as string, title: `${sku?.name ?? "Oportunidade"} — ${v.company}`,
      stage: 0, owner: "Ana", value: sku?.testTicket ?? 0, nextAction: (v.nextAction as string) || "Qualificar",
      nextActionDate: todayISO(), notes: "",
    });
  }
  if (!opp || !isNew) return;
  if (kind === "proposal" && opp.stage < STAGE.proposta) moveOpportunity(opp.id, STAGE.proposta);
  if (kind === "payment" && v.status === "pago") {
    if (opp.stage < STAGE.pagamento) moveOpportunity(opp.id, STAGE.pagamento);
    upsert("activities", { type: "pagamento", date: v.date as string, owner: opp.owner, description: `Pagamento recebido`, opportunityId: opp.id, prospectId: opp.prospectId, faucetId: opp.faucetId, hours: 0 });
  }
  if (kind === "delivery" && opp.stage < STAGE.entrega && opp.stage >= STAGE.pagamento) moveOpportunity(opp.id, STAGE.entrega);
}

interface Ctx {
  openForm: (kind: FormKind, initial?: Record<string, unknown>) => void;
}
const FormCtx = createContext<Ctx>({ openForm: () => {} });
export const useForms = () => useContext(FormCtx);

export function FormsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ kind: FormKind; initial: Record<string, unknown> } | null>(null);
  const [open, setOpen] = useState(false);
  const openForm = useCallback((kind: FormKind, initial: Record<string, unknown> = {}) => {
    const init = { ...defaults(kind), ...initial };
    if ("stage" in init) (init as any).stage = String((init as any).stage);
    setState({ kind, initial: init });
    setOpen(true);
  }, []);

  return (
    <FormCtx.Provider value={{ openForm }}>
      {children}
      {state && <FormHost kind={state.kind} initial={state.initial} open={open} setOpen={setOpen} />}
    </FormCtx.Provider>
  );
}

function FormHost({ kind, initial, open, setOpen }: { kind: FormKind; initial: Record<string, unknown>; open: boolean; setOpen: (o: boolean) => void }) {
  const db = useDB();
  const isNew = !initial.id;
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title={`${isNew ? "Nova" : "Editar"} ${LABEL[kind]}`}
      fields={fieldsFor(kind, db)}
      initial={initial}
      onSubmit={(raw) => {
        try {
          const v: any = { ...raw };
          if (kind === "opportunity") {
            v.stage = Number(v.stage);
            if (!v.faucetId) v.faucetId = db.prospects.find((p) => p.id === v.prospectId)?.faucetId ?? "";
          }
          if (kind === "activity" && v.opportunityId) {
            const o = db.opportunities.find((x) => x.id === v.opportunityId);
            if (o) {
              v.prospectId = o.prospectId;
              v.faucetId = o.faucetId;
            }
          }
          if (kind === "faucet" && isNew) {
            const sku = db.skus.find((s) => s.id === v.skuId);
            v.icp = v.icp || sku?.icp || "";
            v.channel = v.channel || sku?.channel || "";
          }
          const saved = upsert(COLLECTION[kind], v as never) as any;
          afterSave(kind, { ...v, id: saved.id }, isNew);
          toast.success(`${LABEL[kind].charAt(0).toUpperCase() + LABEL[kind].slice(1)} ${isNew ? "criada(o)" : "atualizada(o)"}`);
          setOpen(false);
        } catch (e) {
          console.error(e);
          toast.error("Erro ao salvar. Tente novamente.");
        }
      }}
    />
  );
}
