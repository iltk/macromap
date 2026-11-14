import type { Ref } from "react";
import type { MenuItem } from "../../types/venues";
import { MACRO_COLORS, needsCheck, proteinDensity } from "../../utils/macros";
import { Icon } from "../ui/icons";
import { ItemActions } from "../tray/ItemActions";
import { toTrayItem } from "../../stores/tray";

export interface MenuMaxima {
  protein: number;
  carbs: number;
  fat: number;
}

/** A menu item drawn like a compact "Nutrition Facts" panel; bars are scaled to the menu's max. */
export function NutritionLabel({
  item,
  maxima,
  restaurantName,
  restaurantSlug,
  highlighted,
  labelRef,
}: {
  item: MenuItem;
  maxima: MenuMaxima;
  restaurantName: string;
  restaurantSlug: string;
  highlighted?: boolean;
  labelRef?: Ref<HTMLLIElement>;
}) {
  const density = proteinDensity(item);
  return (
    <li
      ref={labelRef}
      className={`flex flex-col rounded-lg border-2 bg-white px-4 pt-3 pb-4 ${
        highlighted ? "border-[#1a73e8] shadow-[0_0_0_4px_rgba(26,115,232,0.15)]" : "border-gray-900"
      }`}
    >
      <p className="text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">
        {item.menuCategory ?? "Menu item"}
      </p>
      <h3 className="mt-0.5 text-[17px] leading-snug font-extrabold text-gray-900">
        {item.name}
        {needsCheck(item) && (
          <span
            className="ml-1 inline-flex translate-y-0.5 text-amber-500"
            title="These numbers don't add up in the source data. Treat with caution."
          >
            <Icon name="warning" className="h-4 w-4" title="Unverified values" />
          </span>
        )}
      </h3>
      <p className="text-xs text-gray-600">Serving {item.servingSize ?? "–"}</p>

      <div className="mt-2 h-2 bg-gray-900" />
      <div className="flex items-end justify-between border-b border-gray-900 py-1">
        <span className="text-sm font-extrabold text-gray-900">Calories</span>
        <span className="text-3xl leading-none font-black text-gray-900 tabular-nums">
          {item.calories ?? "–"}
        </span>
      </div>

      <MacroRow label="Protein" value={item.protein} max={maxima.protein} color={MACRO_COLORS.protein} />
      <MacroRow label="Carbs" value={item.carbs} max={maxima.carbs} color={MACRO_COLORS.carbs} />
      <MacroRow label="Fat" value={item.fat} max={maxima.fat} color={MACRO_COLORS.fat} />

      <div className="mt-auto flex items-center justify-between border-t-4 border-gray-900 pt-2 text-xs">
        <span className="text-gray-600">Protein per 100 kcal</span>
        <span className="font-bold text-gray-900 tabular-nums">
          {density != null ? `${density.toFixed(1)} g` : "–"}
        </span>
      </div>
      <div className="mt-3">
        <ItemActions item={toTrayItem(item, restaurantName, restaurantSlug)} />
      </div>
    </li>
  );
}

function MacroRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
}) {
  const pct = value != null && max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="border-b border-gray-300 py-1.5 last:border-b-0">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-bold text-gray-900">{label}</span>
        <span className="text-gray-900 tabular-nums">{value != null ? `${value} g` : "–"}</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
