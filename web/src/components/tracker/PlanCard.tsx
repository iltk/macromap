import { useState } from "react";
import { searchPlaces } from "../../api/venues";
import { useApi } from "../../hooks/useApi";
import { loadMenu } from "../../hooks/useChainMenus";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { notify } from "../../stores/notify";
import { addToPlan, clearPlan, logPlan, setPlanQty, slotForTime, SLOT_LABELS, SLOTS, totalsOf, useTracker, type MealSlot, type Totals } from "../../stores/tracker";
import { toTrayItem } from "../../stores/tray";
import type { DailyTarget } from "../../utils/targets";
import { FoodImage } from "../media/FoodImage";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";

/** Build an order before eating it: see what it does to the rest of the day, then log it in one go. */
export function PlanCard({ date, dayTotals, targets }: { date: string; dayTotals: Totals; targets: DailyTarget | null }) {
  const { plan } = useTracker();
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<MealSlot>(() => slotForTime());
  const debounced = useDebouncedValue(query.trim(), 200);
  const results = useApi(debounced.length >= 2 ? `plan-search:${debounced}` : null, (signal) => searchPlaces(debounced, signal));
  const planTotals = totalsOf(plan);

  const add = async (restaurantSlug: string, restaurantName: string, itemId: string) => {
    try {
      const menu = await loadMenu(restaurantSlug);
      const item = menu.menu.find((m) => m.id === itemId);
      if (item) addToPlan(toTrayItem(item, restaurantName, restaurantSlug));
      setQuery("");
    } catch {
      notify("Couldn't add that item. Try again.");
    }
  };

  const after = targets
    ? {
        calories: targets.calories - dayTotals.calories - planTotals.calories,
        protein: targets.protein - dayTotals.protein - planTotals.protein,
      }
    : null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Plan a meal</h2>
        <p className="text-xs text-gray-500">Build an order and see how it fits before you log it.</p>
      </header>

      <div className="relative px-4 pt-3">
        <Icon name="search" className="pointer-events-none absolute top-5.5 left-6.5 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Add a dish (e.g. teen burger)"
          aria-label="Search dishes to add to the plan"
          className={`${ui.input} pl-8`}
        />
        {debounced.length >= 2 && results.data && (
          <ul className="absolute inset-x-4 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {results.data.items.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No dishes found.</li>}
            {results.data.items.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => add(h.restaurantSlug, h.restaurantName, h.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
                  <FoodImage src={h.imageUrl} alt={h.name} tintKey={h.restaurantSlug} variant="thumb" className="h-8 w-8 shrink-0 rounded" />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                    {h.name} <span className="text-gray-500">· {h.restaurantName}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-500 tabular-nums">{h.calories ?? "–"} cal</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {plan.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-500">Nothing planned.</p>
      ) : (
        <>
          <ul className="mt-2 divide-y divide-gray-100">
            {plan.map(({ item, qty }) => (
              <li key={item.id} className="flex items-center gap-2 px-4 py-2">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate text-gray-900">{item.name}</span>
                  <span className="block text-xs text-gray-500 tabular-nums">
                    {Math.round((item.calories ?? 0) * qty)} cal · {Math.round((item.protein ?? 0) * qty)} g protein
                  </span>
                </span>
                <span className="flex items-center rounded-md border border-gray-300">
                  <button type="button" onClick={() => setPlanQty(item.id, qty - 1)} aria-label={`One less ${item.name}`} className="p-1 text-gray-600">
                    <Icon name="remove" className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
                  <button type="button" onClick={() => setPlanQty(item.id, qty + 1)} aria-label={`One more ${item.name}`} className="p-1 text-gray-600">
                    <Icon name="add" className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-700 tabular-nums">
              This meal: <span className="font-semibold text-gray-900">{Math.round(planTotals.calories)} cal</span> · {Math.round(planTotals.protein)} g protein ·{" "}
              {Math.round(planTotals.carbs)} g carbs · {Math.round(planTotals.fat)} g fat
            </p>
            {after && (
              <p className={`rounded-md px-3 py-2 text-sm tabular-nums ${after.calories < 0 ? "bg-danger-soft text-danger-ink" : "bg-accent-soft text-accent-ink"}`}>
                {after.calories >= 0 ? `Leaves ${Math.round(after.calories)} cal` : `Goes ${Math.round(-after.calories)} cal over`} for the day
                {after.protein > 0 ? ` · ${Math.round(after.protein)} g protein still to go` : " · protein target reached"}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <select value={slot} onChange={(e) => setSlot(e.target.value as MealSlot)} aria-label="Log as" className={`${ui.select} h-9`}>
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {SLOT_LABELS[s]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  logPlan(date, slot);
                  notify(`Logged ${planTotals.count} ${planTotals.count === 1 ? "item" : "items"} to ${SLOT_LABELS[slot].toLowerCase()}`);
                }}
                className={ui.btnPrimary}
              >
                Log all
              </button>
              <button type="button" onClick={clearPlan} className={`text-sm ${ui.link}`}>
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
