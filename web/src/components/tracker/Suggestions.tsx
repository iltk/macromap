import { useMemo, useState } from "react";
import { Link } from "react-router";
import { fetchRestaurants, fetchSuggestions, suggestionQuery } from "../../api/venues";
import { useApi } from "../../hooks/useApi";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useNow } from "../../hooks/useNow";
import { notify } from "../../stores/notify";
import { usePrefs } from "../../stores/prefs";
import { logItem, slotForTime, SLOT_LABELS, SLOTS, type MealSlot, type Totals } from "../../stores/tracker";
import { toTrayItem } from "../../stores/tray";
import type { MenuItem, SuggestionLocation, SuggestionRestaurant } from "../../types/venues";
import { formatDistance } from "../../utils/geo";
import { getOpenStatus } from "../../utils/openingHours";
import type { DailyTarget } from "../../utils/targets";
import { FoodImage } from "../media/FoodImage";
import { logWithNotice } from "../tray/logWithNotice";
import { ui } from "../ui/styles";
import { EmptyState } from "../ui/EmptyState";

type Tab = "items" | "combos" | "protein";

interface Row {
  key: string;
  items: MenuItem[];
  restaurant: SuggestionRestaurant;
  calories: number;
  protein: number;
  location: SuggestionLocation | null;
}

/** "What to eat next": items and combos that fit what's left today. */
export function Suggestions({ totals, targets }: { totals: Totals; targets: DailyTarget }) {
  const prefs = usePrefs();
  const now = useNow();
  const { coords, error: geoError } = useGeolocation();
  const [tab, setTab] = useState<Tab>("items");
  const [nearMe, setNearMe] = useState(true);
  const [openNow, setOpenNow] = useState(false);
  const [restaurant, setRestaurant] = useState("");
  const [meal, setMeal] = useState<MealSlot>(() => slotForTime());
  const restaurants = useApi("restaurants?", (signal) => fetchRestaurants("", signal));

  const left = {
    calories: targets.calories - totals.calories,
    protein: targets.protein - totals.protein,
    carbs: targets.carbs - totals.carbs,
    fat: targets.fat - totals.fat,
  };
  const useLocation = nearMe && coords !== null;
  const done = left.calories < 50;

  const query = done
    ? null
    : suggestionQuery({
        calories: left.calories,
        protein: left.protein,
        carbs: left.carbs,
        fat: left.fat,
        avoid: prefs.avoid,
        lat: useLocation ? coords!.lat : undefined,
        lng: useLocation ? coords!.lng : undefined,
        restaurant: restaurant || undefined,
        limit: 12,
        meal: tab === "protein" ? undefined : meal,
        mode: tab === "protein" ? "protein" : undefined,
      });
  const { data, error, isLoading, retry } = useApi(query, (signal) => fetchSuggestions(query!, signal), { keepPrevious: true });

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const pickLocation = (locs: SuggestionLocation[]) =>
      openNow ? (locs.find((l) => getOpenStatus(l.openingHours, now)?.open) ?? null) : (locs[0] ?? null);
    const all: Row[] =
      tab !== "combos"
        ? data.items.map((s) => ({
            key: s.item.id,
            items: [s.item],
            restaurant: s.restaurant,
            calories: s.item.calories ?? 0,
            protein: s.item.protein ?? 0,
            location: pickLocation(s.locations),
          }))
        : data.combos.map((c) => ({
            key: c.items.map((i) => i.id).join("+"),
            items: c.items,
            restaurant: c.restaurant,
            calories: c.calories,
            protein: c.protein,
            location: pickLocation(c.locations),
          }));
    return (openNow && useLocation ? all.filter((r) => r.location) : all).slice(0, tab === "items" ? 5 : 4);
  }, [data, tab, openNow, useLocation, now]);

  const reason = (r: Row) => {
    const after = left.calories - r.calories;
    if (tab === "protein") {
      return r.protein >= left.protein * 0.9
        ? `gets you to your protein target, leaves ${Math.round(after)} cal`
        : `+${Math.round(r.protein)} g protein for ${Math.round(r.calories)} cal`;
    }
    const parts = [];
    if (left.protein > 0) parts.push(`covers ${Math.round(Math.min(r.protein, left.protein))} of your ${Math.round(left.protein)} g protein left`);
    parts.push(after >= 0 ? `leaves ${Math.round(after)} cal` : `goes ${Math.round(-after)} cal over`);
    return parts.join(", ");
  };

  const logRow = (r: Row) => {
    if (r.items.length === 1) return logWithNotice(toTrayItem(r.items[0], r.restaurant.name, r.restaurant.slug));
    r.items.forEach((m) => logItem(toTrayItem(m, r.restaurant.name, r.restaurant.slug)));
    notify(`Logged ${r.items.map((m) => m.name).join(" + ")}`);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            What to eat for{" "}
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value as MealSlot)}
              aria-label="Meal"
              className="rounded border-0 bg-transparent p-0 pr-5 font-semibold text-link underline decoration-dotted underline-offset-4 outline-none"
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s === "snack" ? "a snack" : SLOT_LABELS[s].toLowerCase()}
                </option>
              ))}
            </select>
          </h2>
          <p className="text-xs text-gray-500 tabular-nums">
            For {Math.max(0, Math.round(left.calories))} cal and {Math.max(0, Math.round(left.protein))} g protein left
            {prefs.avoid.length > 0 && ", avoiding your allergens"}
          </p>
        </div>
        <div className="inline-flex rounded-md border border-gray-300 p-0.5" role="radiogroup" aria-label="Suggestion type">
          {(["items", "combos", "protein"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tab === t}
              onClick={() => setTab(t)}
              className={`rounded px-2.5 py-1 text-xs ${tab === t ? "bg-gray-900 font-medium text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {t === "items" ? "Single items" : t === "combos" ? "Combos" : "Fill protein"}
            </button>
          ))}
        </div>
      </header>

      {tab === "protein" && left.protein <= 0 ? (
        <EmptyState size="sm" art="chicken" title="Protein target reached" text="You've hit today's protein. Switch back to single items for anything else." />
      ) : done ? (
        <EmptyState size="sm" art="plate" title="You've reached today's target" text="Nice work. Suggestions come back tomorrow, or raise your targets if you need more." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2.5">
            <label className={`${ui.btnSmall} cursor-pointer ${useLocation ? "border-accent bg-accent-soft text-accent-ink" : ""}`} title={coords ? "" : geoError ?? "Waiting for your location"}>
              <input type="checkbox" checked={nearMe} onChange={(e) => setNearMe(e.target.checked)} disabled={!coords} className="accent-(--color-accent)" />
              Near me
            </label>
            <label className={`${ui.btnSmall} cursor-pointer ${openNow && useLocation ? "border-accent bg-accent-soft text-accent-ink" : ""}`}>
              <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} disabled={!useLocation} className="accent-(--color-accent)" />
              Open now
            </label>
            <select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} aria-label="Restaurant" className={`${ui.select} h-8`}>
              <option value="">Any restaurant</option>
              {(restaurants.data ?? [])
                .filter((r) => r.menuItemCount > 0)
                .map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
            </select>
            {!coords && <span className="text-xs text-gray-500">Turn on location for nearby picks</span>}
          </div>

          {error ? (
            <div className="px-4 py-5 text-sm">
              <p className="text-gray-700">Couldn't load suggestions.</p>
              <button type="button" onClick={retry} className={`mt-2 ${ui.btn}`}>
                Try again
              </button>
            </div>
          ) : isLoading && !data ? (
            <div className="space-y-2 px-4 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              size="sm"
              art="burger"
              title="Nothing fits right now"
              text={useLocation ? "Nearby menus don't have anything within what's left. Widen the search to see more." : "Try another restaurant or meal."}
              action={
                useLocation || openNow || restaurant ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNearMe(false);
                      setOpenNow(false);
                      setRestaurant("");
                    }}
                    className={ui.btnSmall}
                  >
                    Search everywhere
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className={`divide-y divide-gray-100 ${isLoading ? "opacity-60" : ""}`}>
              {rows.map((r) => {
                const status = r.location ? getOpenStatus(r.location.openingHours, now) : null;
                const href = r.location ? `/?place=${r.location.locationId}` : `/restaurants/${r.restaurant.slug}?item=${r.items[0].id}`;
                return (
                  <li key={r.key} className="flex gap-3 px-4 py-3">
                    <div className="flex shrink-0 -space-x-3">
                      {r.items.map((m) => (
                        <FoodImage section={m.menuCategory} key={m.id} src={m.imageUrl} alt={m.name} tintKey={m.menuCategory ?? ""} variant="thumb" className="h-12 w-12 rounded-md border-2 border-white" />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{r.items.map((m) => m.name).join(" + ")}</p>
                      <p className="text-xs text-gray-500">
                        {r.restaurant.name}
                        {r.location && ` · ${formatDistance(r.location.distanceMeters)}`}
                        {status && (
                          <>
                            {" · "}
                            <span className={status.open ? "text-success-ink" : "text-danger-ink"}>{status.label}</span>
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-700 tabular-nums">
                        <span className="font-medium">{Math.round(r.calories)} cal</span> ·{" "}
                        <span className="text-accent-ink">{Math.round(r.protein)} g protein</span>
                        <span className="text-gray-500"> · {reason(r)}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <button type="button" onClick={() => logRow(r)} className={ui.btnAccentSmall}>
                          Log it
                        </button>
                        <Link to={href} className={`text-xs ${ui.link}`}>
                          {r.location ? "Show on map" : "View menu"}
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
