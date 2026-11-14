import { useSyncExternalStore } from "react";
import { allergenLabel } from "../utils/allergens";
import { goalFor, hasLimits, NO_LIMITS, type MacroLimits } from "../utils/goals";
import { createPersistentStore } from "../utils/storage";
import { useAvoidList } from "./allergens";

const limitsStore = createPersistentStore<MacroLimits>("macromap.limits.v1", NO_LIMITS);

export const setLimits = (l: MacroLimits | ((prev: MacroLimits) => MacroLimits)) => limitsStore.set(l);
const useLimits = () => useSyncExternalStore(limitsStore.subscribe, limitsStore.get, limitsStore.get);

/** The viewer's preferences (goal limits + allergens to avoid), used on every page. */
export function usePrefs() {
  const limits = useLimits();
  const avoid = useAvoidList();
  const preset = goalFor(limits);
  const goalActive = hasLimits(limits);
  const goalName = !goalActive ? null : preset ? preset.label : "Custom goal";

  const parts: string[] = [];
  if (goalName) parts.push(goalName);
  if (avoid.length) parts.push(`no ${avoid.map((a) => allergenLabel(a).toLowerCase()).join(", ")}`);

  return {
    limits,
    avoid,
    goalActive,
    goalName,
    /** Goal rule in words, e.g. "30 g+ protein". */
    goalRule: preset && goalActive ? preset.rule : describeLimits(limits),
    active: goalActive || avoid.length > 0,
    summary: parts.join(" · "),
  };
}

export function describeLimits(l: MacroLimits): string {
  const out: string[] = [];
  if (l.maxCalories !== null) out.push(`≤ ${l.maxCalories} cal`);
  if (l.minProtein !== null) out.push(`${l.minProtein} g+ protein`);
  if (l.maxCarbs !== null) out.push(`≤ ${l.maxCarbs} g carbs`);
  return out.join(", ");
}
