import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { fetchRestaurantMenu } from "../api/venues";
import { SiteHeader } from "../components/layout/SiteHeader";
import { MenuItemCard } from "../components/restaurants/MenuItemCard";
import { RestaurantLogo } from "../components/restaurants/RestaurantLogo";
import { Icon } from "../components/ui/icons";
import { useApi } from "../hooks/useApi";
import type { MenuItem, RestaurantMenu } from "../types/venues";
import { proteinDensity } from "../utils/macros";

const CALORIE_OPTIONS = [200, 300, 400, 500, 600, 800, 1000];
const PROTEIN_OPTIONS = [10, 15, 20, 25, 30, 40];

type SortKey = "menu" | "calories-asc" | "protein-desc" | "density-desc";
const SORT_LABELS: Record<SortKey, string> = {
  menu: "Menu order",
  "calories-asc": "Lowest calories",
  "protein-desc": "Most protein",
  "density-desc": "Protein per calorie",
};

export function RestaurantMenuPage() {
  const { slug = "" } = useParams();
  const { data, error, isLoading, retry } = useApi(`menu:${slug}`, (signal) =>
    fetchRestaurantMenu(slug, signal),
  );

  useEffect(() => {
    if (data) document.title = `${data.name} calories & macros · MacroMap`;
  }, [data]);

  return (
    <div className="min-h-dvh bg-[#f8f9fa]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {error ? (
          <div className="py-24 text-center">
            <p className="text-xl font-semibold text-gray-900">
              {error === "Not found" ? "We couldn't find that restaurant" : "Couldn't load this menu"}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {error !== "Not found" && (
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-[#1a73e8]"
                >
                  Try again
                </button>
              )}
              <Link to="/restaurants" className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white">
                All restaurants
              </Link>
            </div>
          </div>
        ) : isLoading || !data ? (
          <MenuSkeleton />
        ) : (
          // key: reset filters when switching restaurants
          <MenuView key={data.slug} restaurant={data} />
        )}
      </main>
    </div>
  );
}

function MenuView({ restaurant }: { restaurant: RestaurantMenu }) {
  const [searchParams] = useSearchParams();
  const focusItemId = searchParams.get("item");
  const [text, setText] = useState("");
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [minProtein, setMinProtein] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("menu");
  const [tab, setTab] = useState<string>("all");
  const focusRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusItemId]);

  const { menu } = restaurant;

  // categories in the order they first appear on the menu
  const categories = useMemo(() => {
    const seen = new Map<string, number>();
    for (const m of menu) {
      const c = m.menuCategory ?? "Other";
      seen.set(c, (seen.get(c) ?? 0) + 1);
    }
    return [...seen.entries()];
  }, [menu]);

  const visible = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const list = menu.filter(
      (m) =>
        (tab === "all" || (m.menuCategory ?? "Other") === tab) &&
        (!needle || m.name.toLowerCase().includes(needle)) &&
        (maxCalories === null || (m.calories != null && m.calories <= maxCalories)) &&
        (minProtein === null || (m.protein != null && m.protein >= minProtein)),
    );
    const by = (f: (m: MenuItem) => number | null, dir: 1 | -1) =>
      [...list].sort((a, b) => {
        const av = f(a);
        const bv = f(b);
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av - bv) * dir;
      });
    switch (sort) {
      case "calories-asc":
        return by((m) => m.calories, 1);
      case "protein-desc":
        return by((m) => m.protein, -1);
      case "density-desc":
        return by(proteinDensity, -1);
      default:
        return list;
    }
  }, [menu, text, tab, maxCalories, minProtein, sort]);

  const bestPick = useMemo(() => {
    let best: MenuItem | null = null;
    for (const m of menu) {
      const d = proteinDensity(m);
      if (d != null && (m.protein ?? 0) >= 15 && (!best || d > (proteinDensity(best) ?? 0))) best = m;
    }
    return best;
  }, [menu]);

  const filtersActive =
    text.trim() !== "" || maxCalories !== null || minProtein !== null || tab !== "all";
  const clearFilters = () => {
    setText("");
    setMaxCalories(null);
    setMinProtein(null);
    setTab("all");
  };

  return (
    <>
      {/* header */}
      <section className="flex flex-col gap-6 border-b border-gray-200 py-8 sm:flex-row sm:items-start sm:justify-between sm:py-10">
        <div className="flex items-start gap-5">
          <RestaurantLogo
            name={restaurant.name}
            brandColor={restaurant.brandColor}
            category={restaurant.category}
            size="lg"
          />
          <div>
            <Link to="/restaurants" className="text-sm text-gray-500 hover:text-[#1a73e8]">
              ← All restaurants
            </Link>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {restaurant.name}
            </h1>
            {restaurant.description && <p className="mt-2 text-gray-600">{restaurant.description}.</p>}
            <p className="text-gray-600">Explore the menu with calories and macros for every item.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          <Link
            to={`/?chain=${restaurant.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765cc]"
          >
            <Icon name="place" className="h-4 w-4" />
            {restaurant.locationCount} locations on the map
          </Link>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe]"
          >
            ⇄ Change restaurant
          </Link>
        </div>
      </section>

      {menu.length === 0 ? (
        <div className="py-20 text-center">
          <Icon name="restaurant" className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-xl font-semibold text-gray-900">Nutrition info coming soon</p>
          <p className="mt-2 text-gray-600">
            We don't have menu macros for {restaurant.name} yet, but you can still find its locations.
          </p>
          <Link
            to={`/?chain=${restaurant.slug}`}
            className="mt-6 inline-flex rounded-full bg-[#1a73e8] px-5 py-2.5 text-sm font-medium text-white"
          >
            View locations on the map
          </Link>
        </div>
      ) : (
        <>
          {/* filters */}
          <div className="mt-8 flex flex-col gap-3 md:flex-row">
            <label className="flex h-[68px] w-full items-center gap-3 rounded-2xl md:flex-1 border border-gray-300 bg-white px-5 focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/20">
              <Icon name="search" className="h-5 w-5 text-gray-500" />
              <input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Search ${restaurant.name}'s menu`}
                aria-label={`Search ${restaurant.name}'s menu`}
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
              />
            </label>
            <div className="grid grid-cols-2 gap-3 md:flex">
              <SelectBox
                label="Calories, up to"
                value={maxCalories}
                onChange={setMaxCalories}
                options={CALORIE_OPTIONS}
                format={(v) => `${v} kcal`}
              />
              <SelectBox
                label="Protein, at least"
                value={minProtein}
                onChange={setMinProtein}
                options={PROTEIN_OPTIONS}
                format={(v) => `${v} g`}
              />
            </div>
          </div>

          {/* tabs + sort */}
          <div className="mt-6 flex flex-col-reverse gap-3 border-b border-gray-200 sm:flex-row sm:items-end sm:justify-between">
            <div role="tablist" className="no-scrollbar -mb-px flex gap-6 overflow-x-auto">
              {[["all", menu.length] as [string, number], ...categories].map(([c, count]) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={tab === c}
                  onClick={() => setTab(c)}
                  className={`shrink-0 border-b-[3px] pb-3 text-[15px] whitespace-nowrap ${
                    tab === c
                      ? "border-[#1a73e8] font-medium text-[#1a73e8]"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {c === "all" ? "All menu" : c}
                  <span className="ml-1.5 text-xs text-gray-400">{count}</span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 pb-3 text-sm text-gray-600">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-[#1a73e8]"
              >
                {Object.entries(SORT_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8 mb-5 flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">On the menu</h2>
            <p className="text-sm text-gray-500">
              {visible.length} of {menu.length} items
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="ml-3 font-medium text-[#1a73e8] hover:underline">
                  Clear filters
                </button>
              )}
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <p className="font-medium text-gray-900">No items match these filters.</p>
              <button type="button" onClick={clearFilters} className="mt-3 text-sm font-medium text-[#1a73e8]">
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {bestPick && !filtersActive && sort === "menu" && (
                <BestPickCard item={bestPick} onShowAll={() => setSort("density-desc")} />
              )}
              {visible.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  highlighted={item.id === focusItemId}
                  cardRef={item.id === focusItemId ? focusRef : undefined}
                />
              ))}
            </ul>
          )}

          <p className="mt-10 text-center text-xs text-gray-400">
            Nutrition values are approximate and based on published restaurant data. Items marked ⚠ have
            figures that don't add up in the source and should be double-checked.
          </p>
        </>
      )}
    </>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  options,
  format,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  options: number[];
  format: (v: number) => string;
}) {
  return (
    <label className="relative flex h-[68px] min-w-[180px] flex-col justify-center rounded-2xl border border-gray-300 bg-white px-5 focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/20">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="flex items-center justify-between font-semibold text-gray-900">
        {value === null ? "Any amount" : format(value)}
        <Icon name="chevronDown" className="h-5 w-5 text-gray-500" />
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Any amount</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {format(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function BestPickCard({ item, onShowAll }: { item: MenuItem; onShowAll: () => void }) {
  const density = proteinDensity(item);
  return (
    <li className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-[#e8f0fe] to-[#d2e3fc] p-8">
      <p className="text-xs font-semibold tracking-wide text-[#1967d2] uppercase">Best protein per calorie</p>
      <p className="mt-3 text-3xl leading-tight font-bold tracking-tight text-gray-900">{item.name}</p>
      <p className="mt-3 text-gray-700">
        {item.protein} g protein for {item.calories} kcal
        {density != null && <> ({density.toFixed(1)} g per 100 kcal)</>}.
      </p>
      <button
        type="button"
        onClick={onShowAll}
        className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#1a73e8] px-5 py-3 text-sm font-medium text-white hover:bg-[#1765cc]"
      >
        Rank the menu this way →
      </button>
    </li>
  );
}

function MenuSkeleton() {
  return (
    <div className="animate-pulse py-10">
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 rounded-2xl bg-gray-200" />
        <div className="space-y-3">
          <div className="h-8 w-56 rounded bg-gray-200" />
          <div className="h-4 w-80 rounded bg-gray-200" />
        </div>
      </div>
      <div className="mt-10 h-16 rounded-2xl bg-gray-200" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-60 rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
