import type { MenuItem } from "../types/venues";

/** Priority food allergens (Health Canada list), using the codes from the menu CSVs. */
export const ALLERGENS: { code: string; label: string }[] = [
  { code: "milk", label: "Milk" },
  { code: "egg", label: "Egg" },
  { code: "wheat", label: "Wheat / gluten" },
  { code: "soy", label: "Soy" },
  { code: "peanut", label: "Peanut" },
  { code: "treenut", label: "Tree nuts" },
  { code: "sesame", label: "Sesame" },
  { code: "mustard", label: "Mustard" },
  { code: "fish", label: "Fish" },
  { code: "shellfish", label: "Shellfish" },
  { code: "sulphites", label: "Sulphites" },
];

export const allergenLabel = (code: string) => ALLERGENS.find((a) => a.code === code)?.label ?? code;

type AllergenStatus = "ok" | "contains" | "unknown";

/**
 * "ok" only when the item's allergen data is known AND lists none of the avoided allergens.
 * Missing data is never treated as safe.
 */
export function allergenStatus(item: Pick<MenuItem, "allergens">, avoid: string[]): AllergenStatus {
  if (avoid.length === 0) return "ok";
  if (item.allergens == null) return "unknown";
  return item.allergens.some((a) => avoid.includes(a)) ? "contains" : "ok";
}
