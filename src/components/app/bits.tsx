import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ScoreBreakdown, ScoreLabel, Tier } from "@/domain/metrics";
import type { Decision, SkuStatus } from "@/domain/types";

export type Tone = "success" | "warning" | "danger" | "info" | "muted" | "primary";

const toneCls: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  info: "bg-info/15 text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary text-primary-foreground border-primary",
};

export function Pill({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide", toneCls[tone], className)}>
      {children}
    </span>
  );
}

export const DemoTag = () => <Pill tone="info" className="px-1 text-[9px]">demo</Pill>;

export const scoreTone = (l: ScoreLabel): Tone =>
  ({ FRIA: "muted", TESTE: "info", "TRAÇÃO": "warning", VENCEDORA: "success", "MÁQUINA": "success" })[l] as Tone;

export const tierTone = (t: Tier): Tone =>
  ({ "PRIORIDADE MÁXIMA": "success", "PRIORIDADE ALTA": "warning", TESTAR: "info", REDUZIR: "muted", PAUSAR: "danger" })[t] as Tone;

export const decisionTone = (d: Decision): Tone =>
  ({ AUMENTAR: "success", "TRANSFORMAR EM MÁQUINA": "success", MANTER: "info", CORRIGIR: "warning", REPOSICIONAR: "warning", PAUSAR: "danger" })[d] as Tone;

export const statusTone = (s: SkuStatus): Tone =>
  (({ "VENDA AGORA": "warning", VALIDADO: "success", PADRONIZADO: "success", "ESCALÁVEL": "success", PAUSADO: "danger", INTERNO: "muted", INVENTARIADO: "muted" }) as Record<string, Tone>)[s] ?? "info";

export function ScoreBadge({ score, detailed }: { score: ScoreBreakdown; detailed?: boolean }) {
  const tone = scoreTone(score.label);
  const bar = { success: "bg-success", warning: "bg-warning", info: "bg-info", muted: "bg-muted-foreground", danger: "bg-danger", primary: "bg-primary" }[tone];
  return (
    <div className="flex items-center gap-2" title={`Mercado ${score.market}/2 · Conversão ${score.conversion}/2 · Caixa ${score.cash}/3 · Economia ${score.economy}/2 · Repetibilidade ${score.repeatability}/1`}>
      <span className="num w-5 text-right font-semibold">{score.total}</span>
      <div className="flex gap-px">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={cn("h-3 w-1.5 rounded-[1px]", i < score.total ? bar : "bg-muted")} />
        ))}
      </div>
      <Pill tone={tone}>{score.label}</Pill>
      {detailed && (
        <span className="num text-[11px] text-muted-foreground">
          M{score.market} C{score.conversion} $ {score.cash} E{score.economy} R{score.repeatability}
        </span>
      )}
    </div>
  );
}

export function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "primary" | "success" | "danger" }) {
  return (
    <div className="panel px-3 py-2.5">
      <div className="label-xs">{label}</div>
      <div className={cn("num mt-0.5 text-xl font-semibold leading-tight", tone === "primary" && "text-primary", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-3 py-6 text-center text-xs text-muted-foreground">{children}</div>;
}

export function Section({ title, right, children, className }: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <header className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="label-xs !text-foreground">{title}</h2>
        {right}
      </header>
      {children}
    </section>
  );
}

/** Dense table primitives */
export const T = {
  wrap: "w-full overflow-x-auto",
  table: "w-full border-collapse text-[12.5px]",
  th: "label-xs whitespace-nowrap border-b bg-surface px-2 py-1.5 text-left font-medium",
  thBtn: "cursor-pointer select-none hover:text-foreground",
  td: "whitespace-nowrap border-b px-2 py-1.5",
  tr: "hover:bg-accent/50",
};
