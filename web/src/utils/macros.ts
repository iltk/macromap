import type { MenuItem } from "../types/venues";
import { fitsLimits, type Goal } from "./goals";
import { allergenStatus } from "./allergens";

export const MACRO_COLORS = {
  protein: "#1a73e8",
  carbs: "#f9ab00",
  fat: "#d93025",
} as const;

/** Share of calories coming from each macro (4/4/9 kcal per gram). */
export function macroSplit(item: Pick<MenuItem, "protein" | "carbs" | "fat">) {
  const p = (item.protein ?? 0) * 4;
  const c = (item.carbs ?? 0) * 4;
  const f = (item.fat ?? 0) * 9;
  const total = p + c + f;
  if (total <= 0) return null;
  return { protein: p / total, carbs: c / total, fat: f / total };
}

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
