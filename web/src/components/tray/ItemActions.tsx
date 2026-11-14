import { addToMeal, toggleCompare, useTray, type TrayItem } from "../../stores/tray";
import { Icon } from "../ui/icons";

/** "+ Meal" and "Compare" buttons for a menu item. `compact` = icon-only (dense lists/tables). */
export function ItemActions({ item, compact = false }: { item: TrayItem; compact?: boolean }) {
  const { meal, compare } = useTray();
  const inMeal = meal.find((e) => e.item.id === item.id)?.qty ?? 0;
  const comparing = compare.some((c) => c.id === item.id);

  const base =
    "inline-flex items-center justify-center gap-1 rounded-full border text-xs font-semibold transition-colors";
  const size = compact ? "h-7 w-7" : "h-7 px-2.5";

  return (
    <span className="inline-flex gap-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addToMeal(item);
        }}
        title={inMeal ? `In your meal ×${inMeal}. Add another` : "Add to meal"}
        aria-label={`Add ${item.name} to meal`}
        className={`${base} ${size} ${
          inMeal ? "border-[#137333] bg-[#e6f4ea] text-[#137333]" : "border-gray-300 text-gray-700 hover:border-gray-900"
        }`}
      >
        <Icon name="add" className="h-3.5 w-3.5" />
        {!compact && (inMeal ? `Meal ×${inMeal}` : "Meal")}
        {compact && inMeal > 0 && <span className="sr-only">×{inMeal}</span>}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleCompare(item);
        }}
        aria-pressed={comparing}
        title={comparing ? "Remove from comparison" : "Compare with another item"}
        aria-label={`${comparing ? "Stop comparing" : "Compare"} ${item.name}`}
        className={`${base} ${size} ${
          comparing ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]" : "border-gray-300 text-gray-700 hover:border-gray-900"
        }`}
      >
        <Icon name="compare" className="h-3.5 w-3.5" />
        {!compact && (comparing ? "Comparing" : "Compare")}
      </button>
    </span>
  );
}
