import type { Ref } from "react";
import type { MenuItem } from "../../types/venues";
import { MACRO_COLORS, macroSplit, needsCheck, proteinDensity } from "../../utils/macros";
import { Icon } from "../ui/icons";

export function MenuItemCard({
  item,
  highlighted,
  cardRef,
}: {
  item: MenuItem;
  highlighted?: boolean;
  cardRef?: Ref<HTMLLIElement>;
}) {
  const split = macroSplit(item);
  const density = proteinDensity(item);

  return (
    <li
      ref={cardRef}
      className={`flex flex-col rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md ${
        highlighted ? "border-[#1a73e8] ring-2 ring-[#1a73e8]/30" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {item.menuCategory && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {item.menuCategory}
          </span>
        )}
        {density != null && (
          <span
            className="ml-auto rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1967d2]"
            title="Grams of protein per 100 calories"
          >
            {density.toFixed(1)} g P / 100 kcal
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg leading-snug font-semibold text-gray-900">
        {item.name}
        {needsCheck(item) && (
          <span
            className="ml-1.5 inline-flex translate-y-0.5 text-amber-500"
            title="These numbers don't add up in the source data. Treat with caution."
          >
            <Icon name="warning" className="h-4 w-4" title="Unverified values" />
          </span>
        )}
      </h3>
      {item.servingSize && <p className="mt-1 text-sm text-gray-500">{item.servingSize} serving</p>}

      <div className="mt-auto pt-5">
        {split && (
          <div
            className="mb-4 flex h-1.5 overflow-hidden rounded-full bg-gray-100"
            title={`Calories from protein ${Math.round(split.protein * 100)}%, carbs ${Math.round(
              split.carbs * 100,
            )}%, fat ${Math.round(split.fat * 100)}%`}
          >
            <span style={{ width: `${split.protein * 100}%`, background: MACRO_COLORS.protein }} />
            <span style={{ width: `${split.carbs * 100}%`, background: MACRO_COLORS.carbs }} />
            <span style={{ width: `${split.fat * 100}%`, background: MACRO_COLORS.fat }} />
          </div>
        )}
        <dl className="grid grid-cols-4 divide-x divide-gray-200 border-t border-gray-200 pt-4 text-center">
          <Stat label="Calories" value={item.calories} />
          <Stat label="Protein" value={item.protein} unit="g" color={MACRO_COLORS.protein} />
          <Stat label="Carbs" value={item.carbs} unit="g" color={MACRO_COLORS.carbs} />
          <Stat label="Fat" value={item.fat} unit="g" color={MACRO_COLORS.fat} />
        </dl>
      </div>
    </li>
  );
}

function Stat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number | null;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="px-1">
      <dd className="text-xl font-medium text-gray-900 tabular-nums">
        {value ?? "–"}
        {unit && value != null && <span className="ml-0.5 text-xs text-gray-500">{unit}</span>}
      </dd>
      <dt className="mt-0.5 flex items-center justify-center gap-1 text-xs text-gray-500">
        {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
        {label}
      </dt>
    </div>
  );
}
