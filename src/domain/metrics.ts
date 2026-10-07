import { safeDiv, todayISO, addDays } from "./format";
import { STAGE, type DB, type Faucet, type ID } from "./types";

export type ScoreLabel = "FRIA" | "TESTE" | "TRAÇÃO" | "VENCEDORA" | "MÁQUINA";

export interface ScoreBreakdown {
  market: number; // 0-2
  conversion: number; // 0-2
  cash: number; // 0-3
  economy: number; // 0-2
  repeatability: number; // 0-1
  total: number; // 0-10
  label: ScoreLabel;
}

export interface FaucetMetrics {
  prospects: number;
  contacts: number;
  responses: number;
  conversations: number;
  diagnostics: number;
  proposals: number;
  sales: number;
  payments: number;
  cash: number;
  pendingCash: number;
  hours: number;
  margin: number;
  cashPerHour: number;
  marginPerHour: number;
  responseRate: number;
  diagnosticRate: number;
  proposalRate: number;
  closeRate: number;
  payingClients: number;
  evidences: number;
  activeDeliveries: number;
  capacity: number;
  score: ScoreBreakdown;
}

export const scoreLabel = (t: number): ScoreLabel =>
  t <= 2 ? "FRIA" : t <= 4 ? "TESTE" : t <= 6 ? "TRAÇÃO" : t <= 8 ? "VENCEDORA" : "MÁQUINA";

/** Score rules (documented in UI on Scoreboard). */
export function computeScore(m: Omit<FaucetMetrics, "score">, recurrent: boolean): ScoreBreakdown {
  const market = m.contacts < 3 ? 0 : m.responseRate >= 0.2 ? 2 : m.responseRate >= 0.08 ? 1 : 0;
  const conversion =
    m.proposals > 0 && m.closeRate >= 0.4
      ? 2
      : (m.proposals > 0 && m.closeRate >= 0.15) || m.diagnosticRate >= 0.5
        ? 1
        : 0;
  const cash = m.cash >= 6000 ? 3 : m.cash >= 2500 ? 2 : m.cash > 0 ? 1 : 0;
  const economy = m.marginPerHour >= 150 ? 2 : m.marginPerHour >= 60 ? 1 : 0;
  const repeatability = m.payingClients >= 2 || (recurrent && m.payingClients >= 1) ? 1 : 0;
  const total = market + conversion + cash + economy + repeatability;
  return { market, conversion, cash, economy, repeatability, total, label: scoreLabel(total) };
}

export interface MetricsIndex {
  prospectStage: Map<ID, number>;
  faucet: Map<ID, FaucetMetrics>;
}

export function buildIndex(db: DB): MetricsIndex {
  const prospectStage = new Map<ID, number>();
  for (const o of db.opportunities) {
    prospectStage.set(o.prospectId, Math.max(prospectStage.get(o.prospectId) ?? 0, o.stage));
  }
  const oppById = new Map(db.opportunities.map((o) => [o.id, o]));
  const skuById = new Map(db.skus.map((s) => [s.id, s]));
  const faucet = new Map<ID, FaucetMetrics>();

  for (const f of db.faucets) {
    const sku = skuById.get(f.skuId);
    const ps = db.prospects.filter((p) => p.faucetId === f.id);
    const st = ps.map((p) => prospectStage.get(p.id) ?? 0);
    const atLeast = (s: number) => st.filter((x) => x >= s).length;
    const pays = db.payments.filter((p) => oppById.get(p.opportunityId)?.faucetId === f.id);
    const paid = pays.filter((p) => p.status === "pago");
    const cash = paid.reduce((a, p) => a + p.amount, 0);
    const pendingCash = pays.filter((p) => p.status === "pendente").reduce((a, p) => a + p.amount, 0);
    const hours = db.activities.filter((a) => a.faucetId === f.id).reduce((a, x) => a + (x.hours || 0), 0);
    const margin = cash * ((sku?.marginPct ?? 0) / 100);
    const payingClients = new Set(paid.map((p) => oppById.get(p.opportunityId)?.prospectId)).size;
    const base = {
      prospects: ps.length,
      contacts: atLeast(STAGE.abordado),
      responses: atLeast(STAGE.respondeu),
      conversations: atLeast(STAGE.dor),
      diagnostics: atLeast(STAGE.diagnostico),
      proposals: atLeast(STAGE.proposta),
      sales: atLeast(STAGE.pagamento),
      payments: paid.length,
      cash,
      pendingCash,
      hours,
      margin,
      cashPerHour: safeDiv(cash, hours),
      marginPerHour: safeDiv(margin, hours),
      responseRate: 0,
      diagnosticRate: 0,
      proposalRate: 0,
      closeRate: 0,
      payingClients,
      evidences: db.evidences.filter((e) => e.faucetId === f.id).length,
      activeDeliveries: db.deliveries.filter(
        (d) => d.status !== "entregue" && oppById.get(d.opportunityId)?.faucetId === f.id,
      ).length,
      capacity: sku?.capacity ?? 0,
    };
    base.responseRate = safeDiv(base.responses, base.contacts);
    base.diagnosticRate = safeDiv(base.diagnostics, base.conversations);
    base.proposalRate = safeDiv(base.proposals, base.diagnostics);
    base.closeRate = safeDiv(base.sales, base.proposals);
    faucet.set(f.id, { ...base, score: computeScore(base, !!sku?.recurrence) });
  }
  return { prospectStage, faucet };
}

export const EMPTY_METRICS: FaucetMetrics = {
  prospects: 0, contacts: 0, responses: 0, conversations: 0, diagnostics: 0, proposals: 0,
  sales: 0, payments: 0, cash: 0, pendingCash: 0, hours: 0, margin: 0, cashPerHour: 0,
  marginPerHour: 0, responseRate: 0, diagnosticRate: 0, proposalRate: 0, closeRate: 0,
  payingClients: 0, evidences: 0, activeDeliveries: 0, capacity: 0,
  score: { market: 0, conversion: 0, cash: 0, economy: 0, repeatability: 0, total: 0, label: "FRIA" },
};

/* ---------- Energy allocation ---------- */

export const TIERS = ["PRIORIDADE MÁXIMA", "PRIORIDADE ALTA", "TESTAR", "REDUZIR", "PAUSAR"] as const;
export type Tier = (typeof TIERS)[number];

export interface Allocation {
  tier: Tier;
  /** adjusted margin per hour used for ranking */
  energyValue: number;
  reasons: string[];
}

/**
 * Recommends where to put energy. Uses margin/hour as base (not gross revenue), adjusted by
 * close rate and evidence, capped by delivery capacity, with rules for untested/cold faucets.
 */
export function allocate(f: Faucet, m: FaucetMetrics): Allocation {
  const reasons: string[] = [];
  const conv = 0.7 + 0.3 * Math.min(1, m.closeRate);
  const ev = m.evidences > 0 ? 1.1 : 0.9;
  const energyValue = m.marginPerHour * conv * ev;

  if (f.decision === "PAUSAR") {
    return { tier: "PAUSAR", energyValue, reasons: ["Decisão do operador: PAUSAR"] };
  }
  if (m.cash === 0) {
    if (m.hours < 8) {
      reasons.push(`Só ${Math.round(m.hours)}h investidas — amostra pequena`);
      if (m.responses > 0) reasons.push(`${m.responses} respostas de ${m.contacts} contatos`);
      return { tier: "TESTAR", energyValue, reasons };
    }
    if (m.responseRate < 0.05) {
      return {
        tier: "PAUSAR",
        energyValue,
        reasons: [`${Math.round(m.hours)}h sem caixa`, `Taxa de resposta ${Math.round(m.responseRate * 100)}%`],
      };
    }
    return {
      tier: "REDUZIR",
      energyValue,
      reasons: [`${Math.round(m.hours)}h investidas sem caixa`, `${m.proposals} propostas em aberto no funil`],
    };
  }

  let tier: Tier = energyValue >= 200 ? "PRIORIDADE MÁXIMA" : energyValue >= 100 ? "PRIORIDADE ALTA" : energyValue >= 45 ? "TESTAR" : "REDUZIR";
  reasons.push(`Margem/hora ${Math.round(m.marginPerHour)} R$/h`);
  reasons.push(`Fechamento ${Math.round(m.closeRate * 100)}%`);
  reasons.push(m.evidences > 0 ? `${m.evidences} evidência(s)` : "Sem evidência registrada");
  if (m.capacity > 0 && m.activeDeliveries >= m.capacity) {
    reasons.push(`Capacidade lotada (${m.activeDeliveries}/${m.capacity} entregas)`);
    if (tier === "PRIORIDADE MÁXIMA") tier = "PRIORIDADE ALTA";
  }
  return { tier, energyValue, reasons };
}

/* ---------- Totals & goals ---------- */

export function totals(db: DB, idx: MetricsIndex) {
  const ms = [...idx.faucet.values()];
  const sum = (k: keyof FaucetMetrics) => ms.reduce((a, m) => a + (m[k] as number), 0);
  const cash = db.payments.filter((p) => p.status === "pago").reduce((a, p) => a + p.amount, 0);
  const hours = db.activities.reduce((a, x) => a + (x.hours || 0), 0);
  const margin = sum("margin");
  const openProposals = db.proposals.filter((p) => p.status === "aberta");
  const contacts = sum("contacts");
  const sales = sum("sales");
  return {
    cash,
    hours,
    margin,
    cashPerHour: safeDiv(cash, hours),
    marginPerHour: safeDiv(margin, hours),
    openProposals: openProposals.length,
    openProposalsValue: openProposals.reduce((a, p) => a + p.value, 0),
    inProgress: db.opportunities.filter((o) => o.stage >= STAGE.qualificado && o.stage < STAGE.pagamento).length,
    diagnostics: sum("diagnostics"),
    contacts,
    responses: sum("responses"),
    conversion: safeDiv(sales, contacts),
    pendingCash: db.payments.filter((p) => p.status === "pendente").reduce((a, p) => a + p.amount, 0),
  };
}

export function goalProgress(db: DB) {
  const today = todayISO();
  const month = today.slice(0, 7);
  const weekStart = addDays(today, -6);
  const paid = db.payments.filter((p) => p.status === "pago");
  const mon = paid.filter((p) => p.date.startsWith(month)).reduce((a, p) => a + p.amount, 0);
  const wk = paid.filter((p) => p.date >= weekStart && p.date <= today).reduce((a, p) => a + p.amount, 0);
  const day = paid.filter((p) => p.date === today).reduce((a, p) => a + p.amount, 0);
  const d = new Date();
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const projection = safeDiv(mon, d.getDate()) * dim;
  const row = (goal: number, done: number) => ({ goal, done, diff: done - goal, pct: safeDiv(done, goal) });
  return {
    monthly: { ...row(db.goals.monthly, mon), projection },
    weekly: row(db.goals.weekly, wk),
    daily: row(db.goals.daily, day),
  };
}
