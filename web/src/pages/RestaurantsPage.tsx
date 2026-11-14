import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { fetchRestaurants, searchPlaces } from "../api/venues";
import { SiteHeader } from "../components/layout/SiteHeader";
import { RestaurantLogo } from "../components/restaurants/RestaurantLogo";
import { Icon } from "../components/ui/icons";
import { useApi } from "../hooks/useApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { RestaurantSummary } from "../types/venues";

type SortKey = "az" | "locations";

export function RestaurantsPage() {
  const { data: restaurants, error, isLoading, retry } = useApi("restaurants", fetchRestaurants);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("az");
  const debounced = useDebouncedValue(query.trim(), 200);
  const dishes = useApi(debounced.length >= 2 ? `search:${debounced}` : null, (signal) =>
    searchPlaces(debounced, signal),
  );

  useEffect(() => {
    document.title = "Restaurants · MacroMap";
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (restaurants ?? []).filter(
      (r) =>
        !needle ||
        r.name.toLowerCase().includes(needle) ||
        (r.description ?? "").toLowerCase().includes(needle),
    );
    return sort === "az"
      ? list
      : [...list].sort((a, b) => b.locationCount - a.locationCount);
  }, [restaurants, query, sort]);

  const dishHits = dishes.data?.items ?? [];

  return (
    <div className="min-h-dvh bg-[#f8f9fa]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* hero */}
        <section className="pt-14 pb-12 text-center sm:pt-20">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            What are you <span className="text-[#1a73e8]">craving?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Browse fast food menus with calories, protein, carbs and fat for every item.
          </p>

          <div className="relative mx-auto mt-8 max-w-2xl text-left">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-gray-300 bg-white px-5 shadow-sm focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/20">
              <Icon name="search" className="h-5 w-5 text-[#1a73e8]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants or dishes"
                aria-label="Search restaurants or dishes"
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
              />
            </div>

            {dishHits.length > 0 && (
              <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                <p className="px-3 pt-1 pb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Dishes
                </p>
                <ul>
                  {dishHits.slice(0, 5).map((d) => (
                    <li key={d.id}>
                      <Link
                        to={`/restaurants/${d.restaurantSlug}?item=${d.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-gray-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900">{d.name}</span>
                          <span className="block text-xs text-gray-500">{d.restaurantName}</span>
                        </span>
                        <span className="shrink-0 text-right text-xs text-gray-600 tabular-nums">
                          {d.calories != null && <span className="font-semibold text-gray-900">{d.calories}</span>}
                          {d.calories != null && " kcal"}
                          {d.protein != null && <span className="block">{d.protein} g protein</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1 text-sm text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-[#1a73e8] hover:decoration-[#1a73e8]"
          >
            Find restaurants near you on the map →
          </Link>
        </section>

        {/* list */}
        <section aria-labelledby="all-restaurants">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="all-restaurants" className="text-2xl font-semibold text-gray-900">
              {query.trim() ? `Restaurants matching “${query.trim()}”` : "All restaurants"}
            </h2>
            <div className="flex gap-1 rounded-full bg-gray-200/70 p-1 text-sm">
              {(
                [
                  ["az", "A–Z"],
                  ["locations", "Most locations"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  aria-pressed={sort === key}
                  className={`rounded-full px-3 py-1 ${
                    sort === key ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <p className="font-medium text-gray-900">Couldn't load restaurants.</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-[#1a73e8] hover:bg-gray-50"
              >
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600">
              No restaurants match “{query.trim()}”.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((r) => (
                <RestaurantCard key={r.slug} restaurant={r} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function RestaurantCard({ restaurant: r }: { restaurant: RestaurantSummary }) {
  return (
    <li>
      <Link
        to={`/restaurants/${r.slug}`}
        className="group flex h-full items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
      >
        <RestaurantLogo name={r.name} brandColor={r.brandColor} category={r.category} />
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-gray-900 group-hover:text-[#1a73e8]">
            {r.name}
          </span>
          {r.description && (
            <span className="mt-1 block text-[15px] leading-snug text-gray-600">{r.description}</span>
          )}
          <span className="mt-2 block text-xs text-gray-500">
            {r.locationCount} {r.locationCount === 1 ? "location" : "locations"} ·{" "}
            {r.menuItemCount > 0 ? (
              `${r.menuItemCount} menu items`
            ) : (
              <span className="text-amber-700">Nutrition coming soon</span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}
