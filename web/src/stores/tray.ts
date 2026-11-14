import { useSyncExternalStore } from "react";
import type { MenuItem } from "../types/venues";
import { createPersistentStore } from "../utils/storage";
import { openSheet } from "./ui";

/** A menu item snapshot, so the tray works across pages without refetching. */
export interface TrayItem {
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

interface TrayState {
  compare: TrayItem[];
}

// v3: the meal and daily target moved to the tracker store (stores/tracker.ts migrates v2 once)
const store = createPersistentStore<TrayState>("macromap.compare.v1", { compare: [] });

export const toTrayItem = (m: MenuItem, restaurantName: string, restaurantSlug: string): TrayItem => ({
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

/** Toggle an item in the comparison (max 2; a third replaces the oldest). */
export function toggleCompare(item: TrayItem) {
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

export const useTray = () => useSyncExternalStore(store.subscribe, store.get, store.get);

