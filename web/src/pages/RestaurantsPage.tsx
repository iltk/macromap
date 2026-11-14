import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { fetchRestaurants, searchPlaces } from "../api/venues";
import { SiteHeader } from "../components/layout/SiteHeader";
import { RestaurantLogo } from "../components/restaurants/RestaurantLogo";
import { Icon } from "../components/ui/icons";
import { useApi } from "../hooks/useApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { RestaurantSummary } from "../types/venues";
import { GOALS, goalById, limitsToQuery, type Goal } from "../utils/goals";

type SortKey = "match" | "az" | "locations";

export function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const goal = goalById(searchParams.get("goal"));
  const goalActive = goal.id !== "any";
  const goalQuery = limitsToQuery(goal.limits);

  const { data: restaurants, error, isLoading, retry } = useApi(
    `restaurants?${goalQuery}`,
    (signal) => fetchRestaurants(goalQuery, signal),
    { keepPrevious: true },
  );
  const [query, setQuery] = useState("");
  const [sortChoice, setSortChoice] = useState<SortKey | null>(null);
  const sort: SortKey = sortChoice ?? (goalActive ? "match" : "az");
  const debounced = useDebouncedValue(query.trim(), 200);
  const dishes = useApi(debounced.length >= 2 ? `search:${debounced}` : null, (signal) =>
    searchPlaces(debounced, signal),
  );

  useEffect(() => {
    document.title = "Restaurants · MacroMap";
  }, []);

  const setGoal = (g: Goal) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (g.id === "any") next.delete("goal");
        else next.set("goal", g.id);
        return next;
      },
      { replace: true },
    );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (restaurants ?? []).filter(
      (r) =>
        !needle ||
        r.name.toLowerCase().includes(needle) ||
        (r.description ?? "").toLowerCase().includes(needle),
    );
    const byName = (a: RestaurantSummary, b: RestaurantSummary) => a.name.localeCompare(b.name);
    switch (sort) {
      case "match":
        return [...list].sort((a, b) => b.matchingItems - a.matchingItems || byName(a, b));
      case "locations":
        return [...list].sort((a, b) => b.locationCount - a.locationCount || byName(a, b));
      default:
        return [...list].sort(byName);
    }
  }, [restaurants, query, sort]);

  const totals = useMemo(
    () => ({
      restaurants: restaurants?.length ?? 0,
      items: (restaurants ?? []).reduce((n, r) => n + r.menuItemCount, 0),
      matches: (restaurants ?? []).reduce((n, r) => n + r.matchingItems, 0),
    }),
    [restaurants],
  );
  const dishHits = dishes.data?.items ?? [];

  return (
    <div className="min-h-dvh bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* intro + goal picker */}
        <section className="grid gap-8 pt-10 pb-8 lg:grid-cols-[1fr_1.15fr] lg:items-end lg:pt-16">
          <div>
            <p className="text-sm font-medium tracking-wide text-gray-500">
              Toronto · {totals.restaurants || "–"} restaurants · {totals.items || "–"} menu items
            </p>
            <h1 className="mt-3 text-4xl leading-[1.05] font-black tracking-tight text-gray-900 sm:text-5xl">
              Eat out without
              <br />
              losing track.
            </h1>
            <p className="mt-4 max-w-md text-gray-600">
              Pick a goal and we'll rank every menu by how much of it actually fits.
            </p>
          </div>

          <fieldset>
            <legend className="mb-3 text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase">
              Step 1 · Your goal
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GOALS.map((g) => {
                const active = g.id === goal.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g)}
                    aria-pressed={active}
                    className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
                    }`}
                  >
                    <span className="block text-[15px] font-semibold">{g.label}</span>
                    <span className={`block text-xs ${active ? "text-gray-300" : "text-gray-500"}`}>
                      {g.rule}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        {/* toolbar */}
        <div className="flex flex-col gap-3 border-t-2 border-gray-900 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase">
            Step 2 · Pick a menu
            {goalActive && restaurants && (
              <span className="ml-2 tracking-normal text-success-ink normal-case">
                {totals.matches} items fit “{goal.label.toLowerCase()}”
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 focus-within:border-gray-900 sm:w-64 sm:flex-none">
              <Icon name="search" className="h-4 w-4 text-gray-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Restaurant or dish"
                aria-label="Search restaurants or dishes"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </label>
            <select
              value={sort}
              onChange={(e) => setSortChoice(e.target.value as SortKey)}
              aria-label="Sort restaurants"
              className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm outline-none focus:border-gray-900"
            >
              <option value="match">Best fit first</option>
              <option value="az">A–Z</option>
              <option value="locations">Most locations</option>
            </select>
          </div>
        </div>

        {/* dish matches from the search box */}
        {dishHits.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {dishHits.slice(0, 8).map((d) => (
              <Link
                key={d.id}
                to={`/restaurants/${d.restaurantSlug}?item=${d.id}`}
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-gray-900"
              >
                <span className="block text-sm font-medium text-gray-900">{d.name}</span>
                <span className="block text-xs text-gray-500">
                  {d.restaurantName}
                  {d.calories != null && ` · ${d.calories} kcal`}
                  {d.protein != null && ` · ${d.protein} g P`}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* list */}
        <div className="mt-5">
          {error ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
              <p className="font-medium text-gray-900">Couldn't load restaurants.</p>
              <button type="button" onClick={retry} className="mt-3 text-sm font-semibold text-link">
                Try again
              </button>
            </div>
          ) : isLoading && !restaurants ? (
            <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse bg-gray-50" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-600">
              No restaurants match “{query.trim()}”.
            </p>
          ) : (
            <ol
              className={`divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white transition-opacity ${
                isLoading ? "opacity-60" : ""
              }`}
            >
              {visible.map((r, i) => (
                <RestaurantRow
                  key={r.slug}
                  restaurant={r}
                  rank={sort === "match" && goalActive && r.matchingItems > 0 ? i + 1 : null}
                  goal={goalActive ? goal : null}
                />
              ))}
            </ol>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Prefer to look around?{" "}
          <Link to={goalActive ? `/?goal=${goal.id}` : "/"} className="font-medium text-link hover:underline">
            Open the map
          </Link>
        </p>
      </main>
    </div>
  );
}

function RestaurantRow({
  restaurant: r,
  rank,
  goal,
}: {
  restaurant: RestaurantSummary;
  rank: number | null;
  goal: Goal | null;
}) {
  const hasMenu = r.menuItemCount > 0;
  const share = hasMenu ? r.matchingItems / r.menuItemCount : 0;
  const to = `/restaurants/${r.slug}${goal ? `?goal=${goal.id}` : ""}`;

  return (
    <li>
      <Link
        to={to}
        className={`group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-4 hover:bg-row-hover sm:px-6 md:grid-cols-[2rem_auto_1fr_9rem_7rem_7rem_auto] ${
          hasMenu ? "" : "text-gray-400"
        }`}
      >
        <span className="hidden text-sm font-bold text-gray-400 tabular-nums md:block">
          {rank !== null ? String(rank).padStart(2, "0") : ""}
        </span>
        <span className={hasMenu ? "" : "opacity-50 grayscale"}>
          <RestaurantLogo name={r.name} brandColor={r.brandColor} category={r.category} />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-bold text-gray-900 group-hover:underline">{r.name}</span>
          <span className="block truncate text-sm text-gray-500">
            {r.description ?? "Restaurant"} · {r.locationCount} in Toronto
          </span>
        </span>

        {hasMenu ? (
          <>
            {/* fit meter */}
            <span className="col-span-3 md:col-span-1">
              <span className="flex items-baseline justify-between text-sm">
                <span className="font-bold text-gray-900 tabular-nums">
                  {goal ? r.matchingItems : r.menuItemCount}
                </span>
                <span className="text-xs text-gray-500">
                  {goal ? `of ${r.menuItemCount} fit` : "items"}
                </span>
              </span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                <span
                  className={`block h-full rounded-full ${goal ? "bg-[#188038]" : "bg-gray-300"}`}
                  style={{ width: `${(goal ? share : 1) * 100}%` }}
                />
              </span>
            </span>
            <Stat label="Lightest" value={r.lightestCalories} unit="kcal" />
            <Stat label="Most protein" value={r.topProtein} unit="g" />
          </>
        ) : (
          <span className="col-span-3 text-sm md:col-span-3">Nutrition data coming soon</span>
        )}
        <span className="hidden text-gray-400 group-hover:text-gray-900 md:block" aria-hidden>
          →
        </span>
      </Link>
    </li>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <span className="hidden md:block">
      <span className="block text-[11px] tracking-wide text-gray-500 uppercase">{label}</span>
      <span className="text-base font-semibold text-gray-900 tabular-nums">
        {value ?? "–"}
        <span className="ml-0.5 text-xs font-normal text-gray-500">{unit}</span>
      </span>
    </span>
  );
}
