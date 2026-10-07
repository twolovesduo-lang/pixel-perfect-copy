import { useMemo, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { createSeed } from "@/data/seed";
import { buildIndex, type MetricsIndex } from "@/domain/metrics";
import { addDays, todayISO, uid } from "@/domain/format";
import { STAGES, type CollectionKey, type DB, type Decision, type EntityOf, type Goals, type ID } from "@/domain/types";
import { repository } from "@/services/repository";

let state: DB | null = null;
const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  init() {
    if (state) return;
    state = repository.load() ?? createSeed();
    persist();
  },
  set(updater: (db: DB) => DB) {
    if (!state) return;
    state = updater(state);
    persist();
    listeners.forEach((l) => l());
  },
};

function persist() {
  try {
    if (state) repository.save(state);
  } catch (e) {
    console.error(e);
    toast.error("Não foi possível salvar localmente. Verifique o espaço do navegador.");
  }
}

export function useDB(): DB {
  return useSyncExternalStore(store.subscribe, store.get, () => null) as DB;
}

export function useMetrics(): { db: DB; idx: MetricsIndex } {
  const db = useDB();
  const idx = useMemo(() => buildIndex(db), [db]);
  return { db, idx };
}

/* ---------- actions ---------- */

export function upsert<K extends CollectionKey>(key: K, item: Partial<EntityOf<K>> & { id?: ID }): EntityOf<K> {
  const full = { ...item, id: item.id ?? uid(), createdAt: (item as { createdAt?: string }).createdAt ?? new Date().toISOString() } as EntityOf<K>;
  store.set((db) => {
    const arr = db[key] as EntityOf<K>[];
    const exists = arr.some((x) => x.id === full.id);
    return { ...db, [key]: exists ? arr.map((x) => (x.id === full.id ? { ...x, ...full } : x)) : [full, ...arr] };
  });
  return full;
}

export function remove(key: CollectionKey, id: ID) {
  store.set((db) => ({ ...db, [key]: (db[key] as { id: ID }[]).filter((x) => x.id !== id) }));
}

export function moveOpportunity(id: ID, stage: number, owner?: string) {
  const db = store.get();
  const opp = db?.opportunities.find((o) => o.id === id);
  if (!opp || opp.stage === stage) return;
  store.set((d) => ({
    ...d,
    opportunities: d.opportunities.map((o) => (o.id === id ? { ...o, stage } : o)),
    activities: [
      {
        id: uid(), createdAt: new Date().toISOString(), type: "follow-up", date: todayISO(), owner: owner ?? opp.owner,
        description: `Movida: ${STAGES[opp.stage]} → ${STAGES[stage]}`, opportunityId: id, prospectId: opp.prospectId,
        faucetId: opp.faucetId, hours: 0,
      },
      ...d.activities,
    ],
  }));
}

export function setDecision(faucetId: ID, decision: Decision) {
  store.set((db) => ({ ...db, faucets: db.faucets.map((f) => (f.id === faucetId ? { ...f, decision } : f)) }));
  toast.success(`Decisão: ${decision}`);
}

export function saveGoals(goals: Goals) {
  store.set((db) => ({ ...db, goals }));
}

export function resetDemo() {
  repository.clear();
  state = createSeed();
  persist();
  listeners.forEach((l) => l());
}

export function clearAll() {
  store.set((db) => ({
    ...db, brands: [], skus: [], faucets: [], prospects: [], opportunities: [], activities: [], proposals: [],
    payments: [], deliveries: [], evidences: [], dailyLogs: [],
  }));
}

export { addDays };
