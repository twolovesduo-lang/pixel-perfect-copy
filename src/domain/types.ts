export type ID = string;

export const SKU_STATUSES = [
  "INVENTARIADO",
  "VALIDAR",
  "VENDA AGORA",
  "VALIDADO",
  "PADRONIZADO",
  "ESCALÁVEL",
  "DESENVOLVER",
  "INTERNO",
  "PAUSADO",
] as const;
export type SkuStatus = (typeof SKU_STATUSES)[number];

export const DECISIONS = [
  "AUMENTAR",
  "MANTER",
  "CORRIGIR",
  "REPOSICIONAR",
  "PAUSAR",
  "TRANSFORMAR EM MÁQUINA",
] as const;
export type Decision = (typeof DECISIONS)[number];

export const STAGES = [
  "Prospect",
  "Qualificado",
  "Abordado",
  "Respondeu",
  "Dor Confirmada",
  "Diagnóstico",
  "Proposta",
  "Pagamento",
  "Entrega",
  "Evidência",
  "Expansão",
] as const;
export const STAGE = {
  prospect: 0,
  qualificado: 1,
  abordado: 2,
  respondeu: 3,
  dor: 4,
  diagnostico: 5,
  proposta: 6,
  pagamento: 7,
  entrega: 8,
  evidencia: 9,
  expansao: 10,
} as const;

export const ACTIVITY_TYPES = [
  "contato",
  "resposta",
  "follow-up",
  "reunião",
  "diagnóstico",
  "proposta",
  "cobrança",
  "pagamento",
  "entrega",
  "horas",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const EVIDENCE_TYPES = [
  "pagamento",
  "resultado",
  "depoimento",
  "antes/depois",
  "demonstração",
  "case",
  "aprendizado",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const PRIORITIES = ["A", "B", "C"] as const;
export type Priority = (typeof PRIORITIES)[number];

interface Base {
  id: ID;
  createdAt: string;
  /** true = fictitious demo seed data */
  demo?: boolean;
}

export interface Brand extends Base {
  name: string;
  description: string;
}

export interface Sku extends Base {
  brandId: ID;
  name: string;
  category: string;
  problem: string;
  icp: string;
  testTicket: number;
  billingModel: string;
  channel: string;
  /** simultaneous deliveries the team can handle */
  capacity: number;
  status: SkuStatus;
  /** gross margin % (0-100) */
  marginPct: number;
  recurrence: boolean;
}

export interface Faucet extends Base {
  name: string;
  skuId: ID;
  icp: string;
  channel: string;
  decision: Decision;
  notes: string;
}

export interface Prospect extends Base {
  company: string;
  segment: string;
  site: string;
  instagram: string;
  decisionMaker: string;
  role: string;
  contact: string;
  painSignal: string;
  priority: Priority;
  faucetId: ID;
  nextAction: string;
  notes: string;
}

export interface Opportunity extends Base {
  prospectId: ID;
  faucetId: ID;
  title: string;
  stage: number;
  owner: string;
  value: number;
  nextAction: string;
  nextActionDate: string;
  notes: string;
}

export interface Activity extends Base {
  type: ActivityType;
  date: string;
  owner: string;
  description: string;
  opportunityId?: ID;
  prospectId?: ID;
  faucetId?: ID;
  hours: number;
}

export interface Proposal extends Base {
  opportunityId: ID;
  value: number;
  date: string;
  status: "aberta" | "aceita" | "recusada";
  notes: string;
}

export interface Payment extends Base {
  opportunityId: ID;
  amount: number;
  date: string;
  status: "pago" | "pendente";
  method: string;
}

export interface Delivery extends Base {
  opportunityId: ID;
  title: string;
  dueDate: string;
  status: "pendente" | "em andamento" | "entregue";
  critical: boolean;
}

export interface Evidence extends Base {
  type: EvidenceType;
  prospectId: ID;
  skuId: ID;
  faucetId: ID;
  deliveryId?: ID;
  result: string;
  date: string;
  docUrl: string;
  testimonial: string;
  numbers: string;
}

export interface DailyLog extends Base {
  date: string;
  owner: string;
  text: string;
}

export interface Goals {
  monthly: number;
  weekly: number;
  daily: number;
}

export interface DB {
  version: 1;
  brands: Brand[];
  skus: Sku[];
  faucets: Faucet[];
  prospects: Prospect[];
  opportunities: Opportunity[];
  activities: Activity[];
  proposals: Proposal[];
  payments: Payment[];
  deliveries: Delivery[];
  evidences: Evidence[];
  dailyLogs: DailyLog[];
  goals: Goals;
}

export type CollectionKey = Exclude<keyof DB, "version" | "goals">;
export type EntityOf<K extends CollectionKey> = DB[K][number];
