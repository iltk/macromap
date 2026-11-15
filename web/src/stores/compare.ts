import { useSyncExternalStore } from "react";
import type { MenuItem } from "../types/venues";
import { createPersistentStore } from "../utils/storage";
import { openSheet } from "./ui";

/** A menu item as logged or compared: a snapshot, so it still shows if the menu changes. */
export interface ItemRef {
  id: string;
  name: string;
  restaurantName: string;
  restaurantSlug: string;
  servingSize: string | null;
  imageUrl: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface CompareState {
  compare: ItemRef[];
}

const store = createPersistentStore<CompareState>("macromap.compare.v1", { compare: [] });

export const toItemRef = (m: MenuItem, restaurantName: string, restaurantSlug: string): ItemRef => ({
  id: m.id,
  name: m.name,
  restaurantName,
  restaurantSlug,
  servingSize: m.servingSize,
  imageUrl: m.imageUrl,
  calories: m.calories,
  protein: m.protein,
  carbs: m.carbs,
  fat: m.fat,
});

/** Two items at most; a third replaces the oldest. */
export function toggleCompare(item: ItemRef) {
  store.set((s) => {
    if (s.compare.some((c) => c.id === item.id)) {
      return { ...s, compare: s.compare.filter((c) => c.id !== item.id) };
    }
    const compare = [...s.compare, item].slice(-2);
    if (compare.length === 2) openSheet("compare");
    return { ...s, compare };
  });
}

export const clearCompare = () => store.set((s) => ({ ...s, compare: [] }));

export const useCompare = () => useSyncExternalStore(store.subscribe, store.get, store.get);


export const compareSnapshot = () => store.get().compare;
export const restoreCompare = (compare: ItemRef[]) => store.set((s) => ({ ...s, compare }));
