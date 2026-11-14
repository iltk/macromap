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
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface MealEntry {
  item: TrayItem;
  qty: number;
}

export interface DailyTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DEFAULT_TARGET: DailyTarget = { calories: 2000, protein: 120, carbs: 225, fat: 65 };

interface TrayState {
  meal: MealEntry[];
  compare: TrayItem[];
  target: DailyTarget | null;
}

const store = createPersistentStore<TrayState>("macromap.tray.v2", {
  meal: [],
  compare: [],
  target: null,
});

export const toTrayItem = (m: MenuItem, restaurantName: string, restaurantSlug: string): TrayItem => ({
  id: m.id,
  name: m.name,
  restaurantName,
  restaurantSlug,
  servingSize: m.servingSize,
  calories: m.calories,
  protein: m.protein,
  carbs: m.carbs,
  fat: m.fat,
});

export function addToMeal(item: TrayItem) {
  store.set((s) => {
    const existing = s.meal.find((e) => e.item.id === item.id);
    return {
      ...s,
      meal: existing
        ? s.meal.map((e) => (e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e))
        : [...s.meal, { item, qty: 1 }],
    };
  });
}

export function setQty(id: string, qty: number) {
  store.set((s) => ({
    ...s,
    meal: qty <= 0 ? s.meal.filter((e) => e.item.id !== id) : s.meal.map((e) => (e.item.id === id ? { ...e, qty } : e)),
  }));
}

export const clearMeal = () => store.set((s) => ({ ...s, meal: [] }));

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
export const setTarget = (target: DailyTarget | null) => store.set((s) => ({ ...s, target }));

export const useTray = () => useSyncExternalStore(store.subscribe, store.get, store.get);

export function mealTotals(meal: MealEntry[]) {
  return meal.reduce(
    (t, { item, qty }) => ({
      calories: t.calories + (item.calories ?? 0) * qty,
      protein: t.protein + (item.protein ?? 0) * qty,
      carbs: t.carbs + (item.carbs ?? 0) * qty,
      fat: t.fat + (item.fat ?? 0) * qty,
      count: t.count + qty,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
  );
}
