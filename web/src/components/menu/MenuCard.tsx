import type { Ref } from "react";
import { toItemRef } from "../../stores/compare";
import type { MenuItem } from "../../types/venues";
import { allergenLabel } from "../../utils/allergens";
import { needsCheck } from "../../utils/macros";
import { sectionOf } from "../../utils/menuQuery";
import { FoodImage } from "../media/FoodImage";
import { ItemActions } from "../items/ItemActions";
import { Icon } from "../ui/icons";

export function MenuCard({
  item,
  restaurantName,
  restaurantSlug,
  highlighted,
  cardRef,
}: {
  item: MenuItem;
  restaurantName: string;
  restaurantSlug: string;
  highlighted: boolean;
  cardRef?: Ref<HTMLLIElement>;
}) {
  const subline =
    item.description ??
    [item.servingSize && `${item.servingSize} serving`, item.allergens?.length ? `contains ${item.allergens.map(allergenLabel).join(", ").toLowerCase()}` : null]
      .filter(Boolean)
      .join(" · ");

  return (
    <li
      ref={cardRef}
      className={`flex flex-col overflow-hidden rounded-xl border bg-white ${
        highlighted ? "border-accent ring-2 ring-accent/25" : "border-gray-200"
      }`}
    >
      <FoodImage section={item.menuCategory} src={item.imageUrl} alt={item.name} tintKey={sectionOf(item)} variant="card" className="aspect-[4/3] w-full" />

      <div className="flex flex-1 flex-col px-5 pt-1 pb-4">
        <h3 className="text-[17px] leading-snug font-bold text-gray-900">
          {item.name}
          {needsCheck(item) && (
            <span className="ml-1 inline-flex translate-y-0.5 text-warn-ink" title="These numbers don't add up in the source data.">
              <Icon name="warning" className="h-4 w-4" title="Unverified values" />
            </span>
          )}
        </h3>
        {subline && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{subline}</p>}

        <div className="mt-auto pt-4" />
        <dl className="grid grid-cols-4 divide-x divide-gray-200 border-t border-gray-200 pt-3 text-center">
          <Stat label="Calories" value={item.calories} />
          <Stat label="Protein" value={item.protein} unit="g" accent />
          <Stat label="Carbs" value={item.carbs} unit="g" />
          <Stat label="Fat" value={item.fat} unit="g" />
        </dl>

        <div className="mt-3 -mb-1 flex justify-center border-t border-gray-100 pt-2">
          <ItemActions item={toItemRef(item, restaurantName, restaurantSlug)} />
        </div>
      </div>
    </li>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: number | null; unit?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col-reverse px-1">
      <dt className="mt-0.5 text-xs text-gray-500">{label}</dt>
      <dd className={`text-xl tabular-nums ${accent ? "text-accent-ink" : "text-gray-900"}`}>
        {value ?? "–"}
        {unit && value != null && <span className="ml-0.5 text-xs text-gray-500">{unit}</span>}
      </dd>
    </div>
  );
}
