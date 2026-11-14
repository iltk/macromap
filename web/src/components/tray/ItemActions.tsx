import { addToMeal, toggleCompare, useTray, type TrayItem } from "../../stores/tray";
import { Icon } from "../ui/icons";

/** "Add" (to meal) and "Compare" controls for a menu item. */
export function ItemActions({ item, iconOnly = false }: { item: TrayItem; iconOnly?: boolean }) {
  const { meal, compare } = useTray();
  const inMeal = meal.find((e) => e.item.id === item.id)?.qty ?? 0;
  const comparing = compare.some((c) => c.id === item.id);
  const base = "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium";

  return (
    <span className="inline-flex shrink-0 gap-1">
      <button
        type="button"
        onClick={() => addToMeal(item)}
        title={inMeal ? `In your meal (×${inMeal}). Add another` : "Add to your meal"}
        aria-label={`Add ${item.name} to meal`}
        className={`${base} ${inMeal ? "bg-accent-soft text-accent-ink" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
      >
        <Icon name={inMeal ? "check" : "add"} className="h-3.5 w-3.5" />
        <span className={iconOnly ? "sr-only" : ""}>{inMeal ? `Added${inMeal > 1 ? ` ×${inMeal}` : ""}` : "Add"}</span>
        {iconOnly && inMeal > 1 && <span className="tabular-nums">{inMeal}</span>}
      </button>
      <button
        type="button"
        onClick={() => toggleCompare(item)}
        aria-pressed={comparing}
        title={comparing ? "Remove from comparison" : "Compare with another item"}
        aria-label={`${comparing ? "Stop comparing" : "Compare"} ${item.name}`}
        className={`${base} ${comparing ? "bg-accent-soft text-accent-ink" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
      >
        <Icon name="compare" className="h-3.5 w-3.5" />
        <span className={iconOnly ? "sr-only" : ""}>Compare</span>
      </button>
    </span>
  );
}
