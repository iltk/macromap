import type { MenuItem } from "../types/venues";
import { needsCheck } from "./macros";
import { sectionOf } from "./menuQuery";

export interface Swap {
  item: MenuItem;
  caloriesSaved: number;
  proteinChange: number;
}

/**
 * A lighter alternative from the same menu section: at least 60 cal less and keeps
 * at least 75% of the protein. Prefers the one that keeps the most protein, then the lightest.
 */
export function lighterSwap(item: Pick<MenuItem, "id" | "calories" | "protein"> & { section: string }, menu: MenuItem[]): Swap | null {
  if (item.calories == null) return null;
  let best: MenuItem | null = null;
  for (const m of menu) {
    if (m.id === item.id || sectionOf(m) !== item.section || needsCheck(m) || m.calories == null) continue;
    if (m.calories > item.calories - 60) continue;
    if ((m.protein ?? 0) < (item.protein ?? 0) * 0.75) continue;
    if (!best || (m.protein ?? 0) > (best.protein ?? 0) || ((m.protein ?? 0) === (best.protein ?? 0) && m.calories < (best.calories ?? 0))) best = m;
  }
  return best
    ? { item: best, caloriesSaved: item.calories - (best.calories ?? 0), proteinChange: (best.protein ?? 0) - (item.protein ?? 0) }
    : null;
}
