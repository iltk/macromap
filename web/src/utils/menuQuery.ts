import type { MenuItem } from "../types/venues";
import { allergenStatus } from "./allergens";
import { fitsLimits, type MacroLimits } from "./goals";
import { proteinDensity } from "./macros";

export type MenuSort = "menu" | "calories" | "protein" | "density";

export const MENU_SORTS: Record<MenuSort, string> = {
  menu: "Menu order",
  calories: "Fewest calories",
  protein: "Most protein",
  density: "Most protein per calorie",
};

export interface MenuQuery {
  text: string;
  section: string; // "all" or a menu category
  sort: MenuSort;
  onlyFits: boolean;
}

export const DEFAULT_QUERY: MenuQuery = { text: "", section: "all", sort: "menu", onlyFits: true };

export const sectionOf = (m: MenuItem) => m.menuCategory ?? "Other";

/** Sections in the order they first appear on the menu, with item counts. */
export function menuSections(menu: MenuItem[]): [string, number][] {
  const seen = new Map<string, number>();
  for (const m of menu) seen.set(sectionOf(m), (seen.get(sectionOf(m)) ?? 0) + 1);
  return [...seen.entries()];
}

/**
 * Filters and sorts a menu for the viewer's preferences.
 * Allergens are always enforced; the goal only when `onlyFits` is on.
 */
export function queryMenu(menu: MenuItem[], q: MenuQuery, limits: MacroLimits, avoid: string[]) {
  const needle = q.text.trim().toLowerCase();
  const hidden = { contains: 0, unknown: 0 };
  let fitCount = 0;

  const list = menu.filter((m) => {
    if (q.section !== "all" && sectionOf(m) !== q.section) return false;
    if (needle && !m.name.toLowerCase().includes(needle)) return false;
    const allergen = allergenStatus(m, avoid);
    if (allergen !== "ok") {
      hidden[allergen]++;
      return false;
    }
    const fits = fitsLimits(m, limits);
    if (fits) fitCount++;
    return !q.onlyFits || fits;
  });

  const by = (f: (m: MenuItem) => number | null, dir: 1 | -1) =>
    [...list].sort((a, b) => {
      const av = f(a);
      const bv = f(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    });

  const items =
    q.sort === "calories"
      ? by((m) => m.calories, 1)
      : q.sort === "protein"
        ? by((m) => m.protein, -1)
        : q.sort === "density"
          ? by(proteinDensity, -1)
          : list;

  return { items, hidden, fitCount };
}
