import type { DB } from "@/domain/types";

/**
 * Persistence boundary. Current implementation: browser localStorage (per device).
 * Swap for a remote implementation (e.g. Lovable Cloud) without touching UI code.
 */
export interface Repository {
  load(): DB | null;
  save(db: DB): void;
  clear(): void;
}

const KEY = "pubwar.db.v1";

export const localRepository: Repository = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const db = JSON.parse(raw) as DB;
      return db?.version === 1 ? db : null;
    } catch {
      return null;
    }
  },
  save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};

export const repository: Repository = localRepository;
