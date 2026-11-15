import type { MenuItem } from "../types/venues";
import { fitsLimits, type Goal } from "./goals";
import { allergenStatus } from "./allergens";

/** CSS colours for each macro (theme-aware via CSS variables). */
export const MACRO_COLORS = {
  protein: "var(--color-protein)",
  carbs: "var(--color-carbs)",
  fat: "var(--color-fat)",
} as const;

/** Grams of protein per 100 kcal (a quick "protein density" score). */
export function proteinDensity(item: Pick<MenuItem, "protein" | "calories">): number | null {
  if (!item.calories || item.protein == null) return null;
  return (item.protein / item.calories) * 100;
}

export const needsCheck = (item: Pick<MenuItem, "source">) =>
  Boolean(item.source?.toLowerCase().includes("needs check"));

/** Best item on a menu for a goal: most protein per calorie among items that fit (and have trustworthy numbers). */
export function bestPick(menu: MenuItem[], goal: Goal, avoid: string[] = []): MenuItem | null {
  let best: MenuItem | null = null;
  let bestScore = -1;
  for (const m of menu) {
    if (needsCheck(m) || !fitsLimits(m, goal.limits) || allergenStatus(m, avoid) !== "ok") continue;
    const score = proteinDensity(m) ?? -1;
    if (score > bestScore) {
      best = m;
      bestScore = score;
    }
  }
  return best;
}
