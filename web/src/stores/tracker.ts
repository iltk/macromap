import { useSyncExternalStore } from "react";
import { dayKey } from "../utils/dates";
import { readJson, createPersistentStore } from "../utils/storage";
import type { BodyProfile, DailyTarget } from "../utils/targets";
import type { TrayItem } from "./tray";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

export interface LogEntry {
  id: string;
  item: TrayItem;
  qty: number;
  slot: MealSlot;
  addedAt: string; // ISO time
}

export interface PlanEntry {
  item: TrayItem;
  qty: number;
}

interface TrackerState {
  days: Record<string, LogEntry[]>;
  plan: PlanEntry[];
  targets: DailyTarget | null;
  profile: BodyProfile | null;
  /** Items starred for quick add. */
  favorites: TrayItem[];
  /** Foods the viewer entered by hand (not on any menu). */
  customFoods: TrayItem[];
}

const EMPTY: TrackerState = { days: {}, plan: [], targets: null, profile: null, favorites: [], customFoods: [] };

const KEY = "macromap.tracker.v1";

/** Before 11:00 breakfast, before 16:00 lunch, before 21:00 dinner, otherwise a snack. */
export function slotForTime(d = new Date()): MealSlot {
  const h = d.getHours();
  return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 21 ? "dinner" : "snack";
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

/** First run: carry over the old meal sheet (as today's entries) and its daily target. */
function initialState(): TrackerState {
  const fresh: TrackerState = { ...EMPTY };
  const old = readJson<{ meal?: { item: TrayItem; qty: number }[]; target?: DailyTarget | null } | null>(
    "macromap.tray.v2",
    null,
  );
  if (!old) return fresh;
  const now = new Date();
  const entries: LogEntry[] = (old.meal ?? []).map(({ item, qty }) => ({
    id: newId(),
    item,
    qty,
    slot: slotForTime(now),
    addedAt: now.toISOString(),
  }));
  return { ...fresh, days: entries.length ? { [dayKey(now)]: entries } : {}, targets: old.target ?? null };
}

const hadTracker = (() => {
  try {
    return window.localStorage.getItem(KEY) !== null;
  } catch {
    return true;
  }
})();
const store = createPersistentStore<TrackerState>(KEY, hadTracker ? { ...EMPTY } : initialState());
// fill fields added after a state was first saved, and persist a migrated state once
store.set((s) => ({ ...EMPTY, ...s }));

export const useTracker = () => useSyncExternalStore(store.subscribe, store.get, store.get);

const updateDay = (date: string, fn: (entries: LogEntry[]) => LogEntry[]) =>
  store.set((s) => {
    const next = fn(s.days[date] ?? []);
    const days = { ...s.days };
    if (next.length) days[date] = next;
    else delete days[date];
    return { ...s, days };
  });

/** Log an item; returns the entry so callers can offer Undo / change meal. */
export function logItem(item: TrayItem, opts: { date?: string; slot?: MealSlot; qty?: number } = {}): LogEntry & { date: string } {
  const now = new Date();
  const date = opts.date ?? dayKey(now);
  const entry: LogEntry = { id: newId(), item, qty: opts.qty ?? 1, slot: opts.slot ?? slotForTime(now), addedAt: now.toISOString() };
  updateDay(date, (list) => [...list, entry]);
  return { ...entry, date };
}

export const removeEntry = (date: string, id: string) => updateDay(date, (l) => l.filter((e) => e.id !== id));
export const setEntryQty = (date: string, id: string, qty: number) =>
  qty <= 0 ? removeEntry(date, id) : updateDay(date, (l) => l.map((e) => (e.id === id ? { ...e, qty } : e)));
export const moveEntry = (date: string, id: string, slot: MealSlot) =>
  updateDay(date, (l) => l.map((e) => (e.id === id ? { ...e, slot } : e)));

export function addToPlan(item: TrayItem) {
  store.set((s) => {
    const found = s.plan.find((p) => p.item.id === item.id);
    return {
      ...s,
      plan: found ? s.plan.map((p) => (p.item.id === item.id ? { ...p, qty: p.qty + 1 } : p)) : [...s.plan, { item, qty: 1 }],
    };
  });
}
export const setPlanQty = (id: string, qty: number) =>
  store.set((s) => ({
    ...s,
    plan: qty <= 0 ? s.plan.filter((p) => p.item.id !== id) : s.plan.map((p) => (p.item.id === id ? { ...p, qty } : p)),
  }));
export const clearPlan = () => store.set((s) => ({ ...s, plan: [] }));

/** Moves the whole plan into the log for `date`/`slot`. */
export function logPlan(date: string, slot: MealSlot) {
  store.set((s) => {
    const now = new Date().toISOString();
    const added: LogEntry[] = s.plan.map((p) => ({ id: newId(), item: p.item, qty: p.qty, slot, addedAt: now }));
    return { ...s, plan: [], days: { ...s.days, [date]: [...(s.days[date] ?? []), ...added] } };
  });
}

export const setTargets = (targets: DailyTarget | null) => store.set((s) => ({ ...s, targets }));
export const setProfile = (profile: BodyProfile | null) => store.set((s) => ({ ...s, profile }));

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

export function totalsOf(entries: { item: TrayItem; qty: number }[]): Totals {
  return entries.reduce(
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

/** Today's totals and what's left of the targets (null without targets). */
export function useToday() {
  const { days, targets } = useTracker();
  const totals = totalsOf(days[dayKey()] ?? []);
  const left = targets ? { calories: targets.calories - totals.calories, protein: targets.protein - totals.protein } : null;
  return { totals, targets, left };
}

/* ---------- favourites & custom foods ---------- */

export function toggleFavorite(item: TrayItem) {
  store.set((s) => ({
    ...s,
    favorites: s.favorites.some((f) => f.id === item.id) ? s.favorites.filter((f) => f.id !== item.id) : [item, ...s.favorites],
  }));
}

export const CUSTOM_SLUG = "custom";

/** Creates a hand-entered food (optionally kept in "My foods") and returns it as a loggable item. */
export function createCustomFood(
  food: { name: string; calories: number; protein: number; carbs: number; fat: number; servingSize?: string },
  save: boolean,
): TrayItem {
  const item: TrayItem = {
    id: `custom:${newId()}`,
    name: food.name.trim(),
    restaurantName: "My food",
    restaurantSlug: CUSTOM_SLUG,
    servingSize: food.servingSize?.trim() || null,
    imageUrl: null,
    calories: Math.round(food.calories),
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
  };
  if (save) store.set((s) => ({ ...s, customFoods: [item, ...s.customFoods] }));
  return item;
}

export const removeCustomFood = (id: string) =>
  store.set((s) => ({ ...s, customFoods: s.customFoods.filter((f) => f.id !== id), favorites: s.favorites.filter((f) => f.id !== id) }));
