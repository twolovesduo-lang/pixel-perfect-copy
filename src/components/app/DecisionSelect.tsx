import { setDecision } from "@/state/store";
import { DECISIONS, type Decision, type ID } from "@/domain/types";
import { decisionTone } from "./bits";
import { cn } from "@/lib/utils";

const cls = {
  success: "text-success border-success/40",
  info: "text-info border-info/40",
  warning: "text-warning border-warning/40",
  danger: "text-danger border-danger/40",
  muted: "",
  primary: "",
};

export function DecisionSelect({ id, value }: { id: ID; value: Decision }) {
  return (
    <select
      aria-label="Decisão"
      className={cn("field !h-7 !w-auto text-[11px] font-semibold uppercase", cls[decisionTone(value)])}
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDecision(id, e.target.value as Decision)}
    >
      {DECISIONS.map((d) => <option key={d}>{d}</option>)}
    </select>
  );
}
