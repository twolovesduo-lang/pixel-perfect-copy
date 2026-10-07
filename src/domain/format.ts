export const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

const brlFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
export const brl = (n: number) => brlFmt.format(Number.isFinite(n) ? n : 0);
export const brlh = (n: number) => `${brl(n)}/h`;
export const pct = (n: number) => `${Math.round((Number.isFinite(n) ? n : 0) * 100)}%`;
export const hrs = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString("pt-BR")}h`;

export const todayISO = () => toISO(new Date());
export const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return toISO(d);
};
export const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}${y !== String(new Date().getFullYear()) ? "/" + y.slice(2) : ""}`;
};
export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
