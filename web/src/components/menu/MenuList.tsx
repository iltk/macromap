import { useEffect, useRef } from "react";
import { toTrayItem } from "../../stores/tray";
import type { MenuItem } from "../../types/venues";
import { allergenLabel } from "../../utils/allergens";
import { needsCheck, proteinDensity } from "../../utils/macros";
import { sectionOf, type MenuSort } from "../../utils/menuQuery";
import { ItemActions } from "../tray/ItemActions";
import { Icon } from "../ui/icons";

interface Props {
  items: MenuItem[];
  sort: MenuSort;
  restaurantName: string;
  restaurantSlug: string;
  focusItemId: string | null;
  /** "compact" for the narrow map panel, "table" for the full menu page. */
  layout: "compact" | "table";
  onSort?: (sort: MenuSort) => void;
  /** Scroll the focused item into view (off when the item was just highlighted from a list). */
  scrollToFocus?: boolean;
}

function groupBySection(items: MenuItem[], sort: MenuSort) {
  if (sort !== "menu") return [{ title: null as string | null, items }];
  const groups: { title: string | null; items: MenuItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.title === sectionOf(item)) last.items.push(item);
    else groups.push({ title: sectionOf(item), items: [item] });
  }
  return groups;
}

function Warning() {
  return (
    <span className="ml-1 inline-flex translate-y-0.5 text-warn-ink" title="These numbers don't add up in the source data.">
      <Icon name="warning" className="h-3.5 w-3.5" title="Unverified values" />
    </span>
  );
}

const contains = (m: MenuItem) =>
  m.allergens == null ? null : m.allergens.length ? `Contains ${m.allergens.map(allergenLabel).join(", ").toLowerCase()}` : "No major allergens";

export function MenuList({ items, sort, restaurantName, restaurantSlug, focusItemId, layout, onSort, scrollToFocus = true }: Props) {
  const focusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (scrollToFocus) focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusItemId, scrollToFocus]);
  const refFor = (id: string) => (id === focusItemId ? (el: HTMLElement | null) => { focusRef.current = el; } : undefined);
  const groups = groupBySection(items, sort);

  if (layout === "compact") {
    return (
      <div>
        {groups.map((g) => (
          <section key={g.title ?? "all"}>
            {g.title && <h4 className="bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-600">{g.title}</h4>}
            <ul className="divide-y divide-gray-200">
              {g.items.map((m) => (
                <li key={m.id} ref={refFor(m.id)} className={`px-4 py-3 ${m.id === focusItemId ? "bg-accent-soft" : ""}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">
                      {m.name}
                      {needsCheck(m) && <Warning />}
                    </p>
                    <p className="shrink-0 text-sm text-gray-900 tabular-nums">{m.calories ?? "–"} cal</p>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600 tabular-nums">
                    <span className="font-medium text-accent-ink">{m.protein ?? "–"} g protein</span> · {m.carbs ?? "–"} g carbs ·{" "}
                    {m.fat ?? "–"} g fat
                    {m.servingSize && <span className="text-gray-400"> · {m.servingSize}</span>}
                  </p>
                  {contains(m) && <p className="mt-0.5 text-xs text-gray-500">{contains(m)}</p>}
                  <div className="mt-1.5 -ml-2">
                    <ItemActions item={toTrayItem(m, restaurantName, restaurantSlug)} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  const header = (key: MenuSort | null, label: string, numeric = true) => (
    <th scope="col" aria-sort={key && sort === key ? (key === "calories" ? "ascending" : "descending") : undefined} className={`px-3 py-2 font-medium whitespace-nowrap ${numeric ? "text-right" : "text-left"}`}>
      {key && onSort ? (
        <button type="button" onClick={() => onSort(sort === key ? "menu" : key)} className={`hover:text-gray-900 ${sort === key ? "text-gray-900 underline underline-offset-4" : ""}`}>
          {label}
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="border-b border-gray-200 text-gray-500">
          <tr>
            {header(null, "Item", false)}
            {header("calories", "Calories")}
            {header("protein", "Protein")}
            <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">Carbs</th>
            <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">Fat</th>
            {header("density", "Protein per 100 cal")}
            <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.title ?? "all"} className="divide-y divide-gray-100">
            {g.title && (
              <tr className="bg-gray-50">
                <th colSpan={7} scope="rowgroup" className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600">
                  {g.title}
                </th>
              </tr>
            )}
            {g.items.map((m) => {
              const d = proteinDensity(m);
              return (
                <tr key={m.id} ref={refFor(m.id)} className={m.id === focusItemId ? "bg-accent-soft" : "hover:bg-row-hover"}>
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-gray-900">
                      {m.name}
                      {needsCheck(m) && <Warning />}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {[m.servingSize, contains(m)].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right text-gray-900 tabular-nums">{m.calories ?? "–"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right font-medium text-accent-ink tabular-nums">{m.protein ?? "–"} g</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right text-gray-700 tabular-nums">{m.carbs ?? "–"} g</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right text-gray-700 tabular-nums">{m.fat ?? "–"} g</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right text-gray-700 tabular-nums">{d != null ? d.toFixed(1) : "–"}</td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <ItemActions item={toTrayItem(m, restaurantName, restaurantSlug)} iconOnly />
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
