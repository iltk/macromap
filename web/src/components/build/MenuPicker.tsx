import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FoodImage } from "../media/FoodImage";
import { AllergenNotice } from "../restaurants/AllergenNotice";
import { RestaurantLogo } from "../restaurants/RestaurantLogo";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";
import { usePrefs } from "../../stores/prefs";
import { addToPlan, setPlanQty, useTracker } from "../../stores/tracker";
import { toItemRef } from "../../stores/compare";
import { openSheet } from "../../stores/ui";
import { PrefsNote } from "../ui/PrefsNote";
import type { RestaurantMenu, RestaurantSummary } from "../../types/venues";
import { needsCheck } from "../../utils/macros";
import { DEFAULT_QUERY, menuSections, queryMenu } from "../../utils/menuQuery";
import { EmptyState } from "../ui/EmptyState";
import { QtyStepper } from "../ui/QtyStepper";
import { TabBar } from "../ui/TabBar";

export function MenuPicker({ restaurant, restaurants, onChange }: { restaurant: RestaurantMenu; restaurants: RestaurantSummary[]; onChange: (slug: string | null) => void }) {
  const prefs = usePrefs();
  const { plan } = useTracker();
  const [section, setSection] = useState("all");
  const [text, setText] = useState("");
  const [onlyFits, setOnlyFits] = useState(false);
  const sections = menuSections(restaurant.menu);
  const result = useMemo(
    () => queryMenu(restaurant.menu, { ...DEFAULT_QUERY, text, section, onlyFits: prefs.goalActive && onlyFits }, prefs.limits, prefs.avoid),
    [restaurant.menu, text, section, onlyFits, prefs.goalActive, prefs.limits, prefs.avoid],
  );
  const qtyOf = (id: string) => plan.find((p) => p.item.id === id)?.qty ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <RestaurantLogo name={restaurant.name} brandColor={restaurant.brandColor} category={restaurant.category} logoUrl={restaurant.logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-gray-900">{restaurant.name}</p>
          <label className="text-sm text-gray-600">
            <span className="sr-only">Change restaurant</span>
            <select value={restaurant.slug} onChange={(e) => onChange(e.target.value)} className="-ml-0.5 bg-transparent text-sm text-link outline-none hover:underline">
              {restaurants
                .filter((r) => r.menuItemCount > 0)
                .map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.slug === restaurant.slug ? "Change restaurant" : r.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
          <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Search ${restaurant.name}`} aria-label={`Search ${restaurant.name}'s menu`} data-shortcut="search" className={`${ui.input} pl-8`} />
        </div>
        {prefs.goalActive ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={onlyFits} onChange={(e) => setOnlyFits(e.target.checked)} className="accent-(--color-accent)" />
            Only {prefs.goalName?.toLowerCase()} ({result.fitCount})
          </label>
        ) : (
          <button type="button" onClick={() => openSheet("prefs")} className={`text-sm ${ui.link}`}>
            Set a goal
          </button>
        )}
      </div>

      <PrefsNote className="mt-2" />
      <TabBar
        className="mt-3"
        label="Menu sections"
        value={section}
        onChange={setSection}
        tabs={[{ value: "all", label: "Everything", count: restaurant.menu.length }, ...sections.map(([s, n]) => ({ value: s, label: s, count: n }))]}
      />

      <div className="mt-3">
        <AllergenNotice {...result.hidden} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState size="sm" art="plate" title="Nothing matches" text="Try another section or clear the search." />
      ) : (
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {result.items.map((m) => {
            const qty = qtyOf(m.id);
            const ref = toItemRef(m, restaurant.name, restaurant.slug);
            return (
              <li key={m.id} className={`flex items-center gap-3 rounded-lg border bg-white p-2.5 ${qty ? "border-accent" : "border-gray-200"}`}>
                <FoodImage section={m.menuCategory} src={m.imageUrl} alt={m.name} tintKey={m.menuCategory ?? ""} variant="thumb" className="h-14 w-14 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug font-medium text-gray-900">
                    {m.name}
                    {needsCheck(m) && <span className="ml-1 text-warn-ink" title="These numbers don't add up in the source data.">⚠</span>}
                  </p>
                  <p className="text-xs text-gray-500 tabular-nums">
                    {m.calories ?? "–"} cal · <span className="text-accent-ink">{m.protein ?? "–"} g protein</span>
                  </p>
                </div>
                {qty === 0 ? (
                  <button type="button" onClick={() => addToPlan(ref)} aria-label={`Add ${m.name} to order`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900">
                    <Icon name="add" className="h-4 w-4" />
                  </button>
                ) : (
                  <QtyStepper tone="solid" value={qty} label={m.name} onDecrease={() => setPlanQty(m.id, qty - 1)} onIncrease={() => setPlanQty(m.id, qty + 1)} />
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-gray-500">
        Not finding something? <Link to={`/restaurants/${restaurant.slug}`} className={ui.link}>See the full menu</Link>
      </p>
    </div>
  );
}
