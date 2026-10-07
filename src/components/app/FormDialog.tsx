import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FieldType = "text" | "number" | "textarea" | "select" | "date" | "checkbox";
export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  wide?: boolean;
  placeholder?: string;
}

type Values = Record<string, unknown>;

export function FormDialog({
  open, onOpenChange, title, fields, initial, onSubmit, submitLabel = "Salvar",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  fields: Field[];
  initial: Values;
  onSubmit: (v: Values) => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (open) {
      setValues(initial);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const out: Values = { ...values };
    for (const f of fields) {
      const v = values[f.name];
      if (f.type === "number") {
        const n = Number(v);
        if (v === "" || v === undefined || Number.isNaN(n)) {
          if (f.required) errs[f.name] = "Número obrigatório";
          out[f.name] = 0;
        } else if (n < 0) errs[f.name] = "Não pode ser negativo";
        else out[f.name] = n;
      } else if (f.required && (v === undefined || v === null || String(v).trim() === "")) {
        errs[f.name] = "Obrigatório";
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(out);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
          {fields.map((f) => {
            const v = values[f.name];
            const id = `fd-${f.name}`;
            return (
              <div key={f.name} className={cn("flex flex-col gap-1", (f.wide || f.type === "textarea") && "sm:col-span-2")}>
                {f.type === "checkbox" ? (
                  <label className="mt-5 flex items-center gap-2 text-[13px]">
                    <input type="checkbox" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} className="accent-primary" />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <label htmlFor={id} className="label-xs">
                      {f.label}
                      {f.required && <span className="text-primary"> *</span>}
                    </label>
                    {f.type === "select" ? (
                      <select id={id} className="field" value={String(v ?? "")} onChange={(e) => set(f.name, e.target.value)}>
                        <option value="">—</option>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea id={id} className="field !h-16 py-1.5" value={String(v ?? "")} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
                    ) : (
                      <input
                        id={id}
                        className="field"
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                        step={f.type === "number" ? "any" : undefined}
                        value={v === undefined || v === null ? "" : String(v)}
                        placeholder={f.placeholder}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    )}
                  </>
                )}
                {errors[f.name] && <span className="text-[11px] text-danger">{errors[f.name]}</span>}
              </div>
            );
          })}
          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" size="sm">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
