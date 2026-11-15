import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { searchPlaces } from "../api/venues";
import { SiteHeader } from "../components/layout/SiteHeader";
import { RestaurantLogo } from "../components/restaurants/RestaurantLogo";
import { Icon } from "../components/ui/icons";
import { ui } from "../components/ui/styles";
import { useApi } from "../hooks/useApi";
import { useRestaurantSummaries } from "../hooks/useRestaurantSummaries";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { usePrefs } from "../stores/prefs";
import { PrefsNote } from "../components/ui/PrefsNote";
import { openSheet } from "../stores/ui";
import type { RestaurantSummary } from "../types/venues";
import { EmptyState } from "../components/ui/EmptyState";

type SortKey = "match" | "az" | "locations";

export function RestaurantsPage() {
  const prefs = usePrefs();
  const { data: restaurants, error, isLoading, retry } = useRestaurantSummaries();
  const [query, setQuery] = useState("");
  const [sortChoice, setSortChoice] = useState<SortKey | null>(null);
  const sort: SortKey = sortChoice ?? (prefs.goalActive ? "match" : "az");
  const debounced = useDebouncedValue(query.trim(), 200);
  const dishes = useApi(debounced.length >= 2 ? `search:${debounced}` : null, (signal) => searchPlaces(debounced, signal));

  useEffect(() => {
    document.title = "Restaurants · MacroMap";
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (restaurants ?? []).filter(
      (r) => !needle || r.name.toLowerCase().includes(needle) || (r.description ?? "").toLowerCase().includes(needle),
    );
    const byName = (a: RestaurantSummary, b: RestaurantSummary) => a.name.localeCompare(b.name);
    if (sort === "match") return [...list].sort((a, b) => b.matchingItems - a.matchingItems || b.menuItemCount - a.menuItemCount || byName(a, b));
    if (sort === "locations") return [...list].sort((a, b) => b.locationCount - a.locationCount || byName(a, b));
    return [...list].sort(byName);
  }, [restaurants, query, sort]);

  const dishHits = dishes.data?.items ?? [];

  return (
    <div className="min-h-dvh bg-page">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-5">
        <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
        <p className="mt-1 text-gray-600">Fast-food menus in Toronto, with calories, protein, carbs and fat for every item.</p>

        <PrefsNote className="mt-4 text-sm" />
        <p className="mt-1 text-sm text-gray-700">
          {prefs.goalActive ? (
            <>Tiles count the items that fit {prefs.goalName?.toLowerCase()} ({prefs.goalRule}).</>
          ) : (
            <>
              <button type="button" onClick={() => openSheet("prefs")} className={ui.link}>
                Set a goal
              </button>{" "}
              to see how much of each menu fits it.
            </>
          )}
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants or dishes"
              aria-label="Search restaurants or dishes"
              data-shortcut="search"
              className={`${ui.input} pl-8`}
            />
          </div>
          <select value={sort} onChange={(e) => setSortChoice(e.target.value as SortKey)} aria-label="Sort restaurants" className={ui.select}>
            <option value="match">Most items that fit</option>
            <option value="az">A to Z</option>
            <option value="locations">Most locations</option>
          </select>
        </div>

        {dishHits.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-semibold text-gray-900">Dishes</h2>
            <ul className="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {dishHits.slice(0, 6).map((d) => (
                <li key={d.id}>
                  <Link to={`/restaurants/${d.restaurantSlug}?item=${d.id}`} className="flex items-baseline justify-between gap-3 px-4 py-2.5 hover:bg-row-hover">
                    <span className="min-w-0 truncate text-sm">
                      <span className="text-gray-900">{d.name}</span>
                      <span className="text-gray-500"> · {d.restaurantName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-600 tabular-nums">
                      {d.calories ?? "–"} cal · <span className="text-accent-ink">{d.protein ?? "–"} g protein</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6" aria-label="Restaurants">
          {error ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm">
              <p className="text-gray-900">Couldn't load restaurants.</p>
              <button type="button" onClick={retry} className={`mt-3 ${ui.btn}`}>
                Try again
              </button>
            </div>
          ) : isLoading && !restaurants ? (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <li key={i} className="aspect-[4/5] animate-pulse rounded-xl border border-gray-200 bg-white" />
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white">
              <EmptyState
                art="plate"
                title={`No restaurants match “${query.trim()}”`}
                text={dishHits.length ? "But some dishes do. See them above." : "Check the spelling, or search for a dish instead."}
                action={
                  <button type="button" onClick={() => setQuery("")} className={ui.btn}>
                    Clear search
                  </button>
                }
              />
            </div>
          ) : (
            <ul className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 ${isLoading ? "opacity-70" : ""}`}>
              {visible.map((r) => (
                <RestaurantTile key={r.slug} r={r} goalActive={prefs.goalActive} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function RestaurantTile({ r, goalActive }: { r: RestaurantSummary; goalActive: boolean }) {
  const hasMenu = r.menuItemCount > 0;
  return (
    <li>
      <Link
        to={`/restaurants/${r.slug}`}
        className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-400 sm:p-5"
      >
        <span className="flex justify-center py-3 sm:py-5">
          <RestaurantLogo name={r.name} brandColor={r.brandColor} category={r.category} logoUrl={r.logoUrl} size="xl" />
        </span>
        <span className="mt-1 block text-center font-semibold text-gray-900 group-hover:underline">{r.name}</span>
        <span className="mt-1 line-clamp-2 min-h-[2.5rem] text-center text-sm leading-5 text-gray-500">{r.description ?? "Restaurant"}</span>
        <span className="mt-auto pt-4">
          <span className="block border-t border-gray-100 pt-3 text-center text-xs leading-5 tabular-nums">
            <span className="block text-gray-700">
              {!hasMenu ? (
                <span className="text-gray-400">No nutrition info yet</span>
              ) : goalActive ? (
                <>
                  <span className={`font-semibold ${r.matchingItems > 0 ? "text-accent-ink" : "text-gray-900"}`}>{r.matchingItems}</span> of{" "}
                  {r.menuItemCount} items fit
                </>
              ) : (
                <>{r.menuItemCount} menu items</>
              )}
            </span>
            <span className="block text-gray-500">
              {r.locationCount} {r.locationCount === 1 ? "location" : "locations"}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}
