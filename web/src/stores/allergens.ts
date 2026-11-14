import { useSyncExternalStore } from "react";
import { createPersistentStore } from "../utils/storage";

const avoid = createPersistentStore<string[]>("macromap.avoid.v1", []);

export function toggleAvoid(code: string) {
  avoid.set((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
}
export const clearAvoid = () => avoid.set([]);

/** Allergens the viewer wants to avoid (shared across pages, saved in this browser). */
export const useAvoidList = () => useSyncExternalStore(avoid.subscribe, avoid.get, avoid.get);
