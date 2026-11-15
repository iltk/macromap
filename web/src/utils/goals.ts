import type { MenuItem } from "../types/venues";

/** Macro limits; null = no limit. */
export interface MacroLimits {
  maxCalories: number | null;
  minProtein: number | null;
  maxCarbs: number | null;
}

export const NO_LIMITS: MacroLimits = { maxCalories: null, minProtein: null, maxCarbs: null };

export interface Goal {
  id: string;
  label: string;
  rule: string;
  limits: MacroLimits;
}

export const GOALS: Goal[] = [
  { id: "any", label: "Anything", rule: "Show every item", limits: NO_LIMITS },
  {
    id: "protein",
    label: "High protein",
    rule: "30 g+ protein",
    limits: { maxCalories: null, minProtein: 30, maxCarbs: null },
  },
  {
    id: "light",
    label: "Light meal",
    rule: "Under 500 cal",
    limits: { maxCalories: 500, minProtein: null, maxCarbs: null },
  },
  {
    id: "lean",
    label: "Lean & filling",
    rule: "≤ 600 cal, 25 g+ protein",
    limits: { maxCalories: 600, minProtein: 25, maxCarbs: null },
  },
  {
    id: "lowcarb",
    label: "Low carb",
    rule: "≤ 20 g carbs",
    limits: { maxCalories: null, minProtein: null, maxCarbs: 20 },
  },
];

const sameLimits = (a: MacroLimits, b: MacroLimits) =>
  a.maxCalories === b.maxCalories && a.minProtein === b.minProtein && a.maxCarbs === b.maxCarbs;

/** The preset matching these limits, or null for a custom combination. */
export const goalFor = (limits: MacroLimits): Goal | null =>
  GOALS.find((g) => sameLimits(g.limits, limits)) ?? null;

export const hasLimits = (l: MacroLimits) =>
  l.maxCalories !== null || l.minProtein !== null || l.maxCarbs !== null;

export function fitsLimits(item: MenuItem, l: MacroLimits): boolean {
  if (l.maxCalories !== null && (item.calories == null || item.calories > l.maxCalories)) return false;
  if (l.minProtein !== null && (item.protein == null || item.protein < l.minProtein)) return false;
  if (l.maxCarbs !== null && (item.carbs == null || item.carbs > l.maxCarbs)) return false;
  return true;
}

/** Query string for the API (`maxCalories=…&minProtein=…`), empty when unlimited. */
export function limitsToQuery(l: MacroLimits): string {
  const p = new URLSearchParams();
  if (l.maxCalories !== null) p.set("maxCalories", String(l.maxCalories));
  if (l.minProtein !== null) p.set("minProtein", String(l.minProtein));
  if (l.maxCarbs !== null) p.set("maxCarbs", String(l.maxCarbs));
  return p.toString();
}
