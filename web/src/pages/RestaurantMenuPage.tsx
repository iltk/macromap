import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { fetchRestaurantMenu } from "../api/venues";
import { SiteHeader } from "../components/layout/SiteHeader";
import { NutritionLabel, type MenuMaxima } from "../components/restaurants/NutritionLabel";
import { RangeField } from "../components/restaurants/RangeField";
import { RestaurantLogo } from "../components/restaurants/RestaurantLogo";
import { Icon } from "../components/ui/icons";
import { useApi } from "../hooks/useApi";
import { ItemActions } from "../components/tray/ItemActions";
import { AllergenPicker } from "../components/restaurants/AllergenPicker";
import { AllergenNotice } from "../components/restaurants/AllergenNotice";
import { useAvoidList } from "../stores/allergens";
import { allergenStatus } from "../utils/allergens";
import { toTrayItem } from "../stores/tray";
import { CATEGORY_COLORS } from "../constants/categories";
import type { MenuItem, RestaurantMenu } from "../types/venues";
import { GOALS, fitsLimits, goalById, goalFor, hasLimits, NO_LIMITS, type MacroLimits } from "../utils/goals";
import { needsCheck, proteinDensity } from "../utils/macros";

type SortKey = "menu" | "name" | "calories" | "protein" | "carbs" | "fat" | "density";
type SortDir = 1 | -1;
type View = "labels" | "table";

const SORT_LABELS: Partial<Record<SortKey, string>> = {
  menu: "Menu order",
  calories: "Calories",
  protein: "Protein",
  density: "Protein per calorie",
};

const sortValue: Record<Exclude<SortKey, "menu" | "name">, (m: MenuItem) => number | null> = {
  calories: (m) => m.calories,
  protein: (m) => m.protein,
  carbs: (m) => m.carbs,
  fat: (m) => m.fat,
  density: proteinDensity,
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
    <div className="min-h-dvh bg-[#f6f5f1]">
      <SiteHeader />
      {error ? (
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <p className="text-xl font-bold text-gray-900">
            {error === "Not found" ? "We couldn't find that restaurant" : "Couldn't load this menu"}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {error !== "Not found" && (
              <button type="button" onClick={retry} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">
                Try again
              </button>
            )}
            <Link to="/restaurants" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
              All restaurants
            </Link>
          </div>
        </div>
      ) : isLoading || !data ? (
        <MenuSkeleton />
      ) : (
        <MenuView key={data.slug} restaurant={data} />
      )}
    </div>
  );
}

function MenuView({ restaurant }: { restaurant: RestaurantMenu }) {
  const [searchParams] = useSearchParams();
  const focusItemId = searchParams.get("item");
  const [limits, setLimits] = useState<MacroLimits>(() => goalById(searchParams.get("goal")).limits);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "menu", dir: 1 });
  const [view, setView] = useState<View>("labels");
  const focusRef = useRef<HTMLElement | null>(null);
  const avoid = useAvoidList();
  const { menu } = restaurant;
  const color = restaurant.brandColor ?? CATEGORY_COLORS[restaurant.category];

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusItemId, view]);

  const maxima: MenuMaxima & { calories: number } = useMemo(
    () => ({
      calories: Math.max(100, ...menu.map((m) => m.calories ?? 0)),
      protein: Math.max(1, ...menu.map((m) => m.protein ?? 0)),
      carbs: Math.max(1, ...menu.map((m) => m.carbs ?? 0)),
      fat: Math.max(1, ...menu.map((m) => m.fat ?? 0)),
    }),
    [menu],
  );

  const categories = useMemo(() => {
    const seen = new Map<string, number>();
    for (const m of menu) seen.set(m.menuCategory ?? "Other", (seen.get(m.menuCategory ?? "Other") ?? 0) + 1);
    return [...seen.entries()];
  }, [menu]);

  const visible = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const list = menu.filter(
      (m) =>
        (category === "all" || (m.menuCategory ?? "Other") === category) &&
        (!needle || m.name.toLowerCase().includes(needle)) &&
        fitsLimits(m, limits) &&
        allergenStatus(m, avoid) === "ok",
    );
    if (sort.key === "menu") return list;
    if (sort.key === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name) * sort.dir);
    const f = sortValue[sort.key];
    return [...list].sort((a, b) => {
      const av = f(a);
      const bv = f(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * sort.dir;
    });
  }, [menu, text, category, limits, sort, avoid]);

  // how many otherwise-matching items the allergen filter removed, and why
  const allergenHidden = useMemo(() => {
    const counts = { contains: 0, unknown: 0 };
    if (avoid.length === 0) return counts;
    for (const m of menu) {
      if ((category !== "all" && (m.menuCategory ?? "Other") !== category) || !fitsLimits(m, limits)) continue;
      const st = allergenStatus(m, avoid);
      if (st !== "ok") counts[st]++;
    }
    return counts;
  }, [menu, avoid, category, limits]);

  const bestPick = useMemo(() => {
    let best: MenuItem | null = null;
    for (const m of menu) {
      const d = proteinDensity(m);
      if (d != null && (m.protein ?? 0) >= 15 && !needsCheck(m) && (!best || d > (proteinDensity(best) ?? 0)))
        best = m;
    }
    return best;
  }, [menu]);

  const activeGoal = goalFor(limits);
  const filtersActive = hasLimits(limits) || text.trim() !== "" || category !== "all" || avoid.length > 0;
  const activeCount =
    [limits.maxCalories, limits.minProtein, limits.maxCarbs].filter((v) => v !== null).length +
    (category !== "all" ? 1 : 0) +
    avoid.length;
  const reset = () => {
    setLimits(NO_LIMITS);
    setText("");
    setCategory("all");
  };
  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: (s.dir * -1) as SortDir }
        : { key, dir: key === "calories" || key === "name" || key === "carbs" || key === "fat" ? 1 : -1 },
    );

  const filters = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase">Goal</p>
        <div className="flex flex-wrap gap-1.5">
          {GOALS.map((g) => {
            const active = activeGoal?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setLimits(g.limits)}
                aria-pressed={active}
                title={g.rule}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-900"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <RangeField
          label="Calories"
          kind="upTo"
          value={limits.maxCalories}
          onChange={(v) => setLimits((l) => ({ ...l, maxCalories: v }))}
          min={50}
          max={Math.ceil(maxima.calories / 50) * 50}
          step={50}
          unit="kcal"
        />
        <RangeField
          label="Protein"
          kind="atLeast"
          value={limits.minProtein}
          onChange={(v) => setLimits((l) => ({ ...l, minProtein: v }))}
          min={0}
          max={Math.ceil(maxima.protein / 5) * 5}
          step={5}
          unit="g"
        />
        <RangeField
          label="Carbs"
          kind="upTo"
          value={limits.maxCarbs}
          onChange={(v) => setLimits((l) => ({ ...l, maxCarbs: v }))}
          min={0}
          max={Math.ceil(maxima.carbs / 5) * 5}
          step={5}
          unit="g"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase">Avoid allergens</p>
        <AllergenPicker size="sm" />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase">Section</p>
        <ul className="space-y-0.5">
          {[["all", menu.length] as [string, number], ...categories].map(([c, n]) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm ${
                  category === c ? "bg-gray-900 font-semibold text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {c === "all" ? "Whole menu" : c}
                <span className={`text-xs tabular-nums ${category === c ? "text-gray-300" : "text-gray-400"}`}>{n}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {filtersActive && (
        <button type="button" onClick={reset} className="text-sm font-semibold text-[#1a73e8] hover:underline">
          Reset everything
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* header band in the brand colour */}
      <header style={{ background: `linear-gradient(90deg, ${color}1f, ${color}08 70%)` }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-5">
            <RestaurantLogo name={restaurant.name} brandColor={restaurant.brandColor} category={restaurant.category} size="lg" />
            <div>
              <Link to="/restaurants" className="text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase hover:text-gray-900">
                ← All menus
              </Link>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{restaurant.name}</h1>
              {restaurant.description && <p className="mt-1 text-gray-700">{restaurant.description}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/?chain=${restaurant.slug}${activeGoal && activeGoal.id !== "any" ? `&goal=${activeGoal.id}` : ""}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
            >
              <Icon name="place" className="h-4 w-4" />
              {restaurant.locationCount} nearby locations
            </Link>
            {restaurant.website && (
              <a
                href={restaurant.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-900/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-white"
              >
                <Icon name="web" className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {menu.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-2xl font-black text-gray-900">Nutrition data coming soon</p>
            <p className="mt-2 text-gray-600">
              We haven't added {restaurant.name}'s menu macros yet. You can still find its locations.
            </p>
            <Link
              to={`/?chain=${restaurant.slug}`}
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Show on the map
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 pt-8 lg:grid-cols-[260px_1fr]">
            {/* sidebar: sticky on desktop, collapsible on mobile */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="hidden rounded-xl border border-gray-200 bg-white p-5 lg:block">
                <h2 className="mb-5 text-lg font-black text-gray-900">Tune the menu</h2>
                {filters}
              </div>
              <details className="rounded-xl border border-gray-200 bg-white lg:hidden">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-bold text-gray-900">
                  Tune the menu
                  <span className="text-sm font-medium text-gray-500">
                    {activeCount > 0 ? `${activeCount} active` : "Goal, macros, section"}
                  </span>
                </summary>
                <div className="border-t border-gray-200 p-4">{filters}</div>
              </details>
            </aside>

            <section aria-label="Menu items" className="min-w-0">
              {/* toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-10 min-w-0 flex-1 basis-56 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 focus-within:border-gray-900">
                  <Icon name="search" className="h-4 w-4 text-gray-500" />
                  <input
                    type="search"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Find on ${restaurant.name}'s menu`}
                    aria-label={`Search ${restaurant.name}'s menu`}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </label>
                {view === "labels" && (
                  <select
                    value={sort.key}
                    onChange={(e) => {
                      const key = e.target.value as SortKey;
                      setSort({ key, dir: key === "calories" ? 1 : -1 });
                    }}
                    aria-label="Sort"
                    className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm outline-none focus:border-gray-900"
                  >
                    {Object.entries(SORT_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {k === "menu" ? label : `${label} ${k === "calories" ? "(low first)" : "(high first)"}`}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex rounded-lg border border-gray-300 bg-white p-0.5 text-sm" role="group" aria-label="View">
                  {(["labels", "table"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      aria-pressed={view === v}
                      className={`rounded-md px-3 py-1.5 font-semibold capitalize ${
                        view === v ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                <span className="font-bold text-gray-900">{visible.length}</span> of {menu.length} items
                {activeGoal && activeGoal.id !== "any" && <> fit <span className="font-semibold">{activeGoal.label.toLowerCase()}</span></>}
                {!activeGoal && " match your limits"}
              </p>
              <AllergenNotice contains={allergenHidden.contains} unknown={allergenHidden.unknown} />

              {bestPick && !filtersActive && sort.key === "menu" && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl bg-gray-900 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm">
                    <span className="mr-2 rounded bg-[#188038] px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                      Best value
                    </span>
                    <span className="font-bold">{bestPick.name}</span> packs {bestPick.protein} g protein into{" "}
                    {bestPick.calories} kcal.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSort({ key: "density", dir: -1 })}
                    className="shrink-0 text-sm font-semibold text-[#8ab4f8] hover:underline"
                  >
                    Rank by protein per calorie →
                  </button>
                </div>
              )}

              {visible.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-10 text-center">
                  <p className="font-bold text-gray-900">Nothing on this menu fits those limits.</p>
                  <button type="button" onClick={reset} className="mt-2 text-sm font-semibold text-[#1a73e8]">
                    Reset everything
                  </button>
                </div>
              ) : view === "labels" ? (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((item) => (
                    <NutritionLabel
                      key={item.id}
                      item={item}
                      maxima={maxima}
                      restaurantName={restaurant.name}
                      restaurantSlug={restaurant.slug}
                      highlighted={item.id === focusItemId}
                      labelRef={item.id === focusItemId ? (el) => { focusRef.current = el; } : undefined}
                    />
                  ))}
                </ul>
              ) : (
                <MenuTable
                  restaurant={restaurant}
                  items={visible}
                  sort={sort}
                  onSort={toggleSort}
                  focusItemId={focusItemId}
                  focusRef={focusRef}
                />
              )}

              <p className="mt-10 text-xs text-gray-500">
                Values are approximate, from published restaurant nutrition data. ⚠ marks figures that
                don't add up in the source.
              </p>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "name", label: "Item" },
  { key: "calories", label: "kcal", numeric: true },
  { key: "protein", label: "Protein", numeric: true },
  { key: "carbs", label: "Carbs", numeric: true },
  { key: "fat", label: "Fat", numeric: true },
  { key: "density", label: "P / 100 kcal", numeric: true },
];

function MenuTable({
  restaurant,
  items,
  sort,
  onSort,
  focusItemId,
  focusRef,
}: {
  restaurant: RestaurantMenu;
  items: MenuItem[];
  sort: { key: SortKey; dir: SortDir };
  onSort: (k: SortKey) => void;
  focusItemId: string | null;
  focusRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border-2 border-gray-900 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b-4 border-gray-900 text-left">
            {COLUMNS.map((c) => {
              const active = sort.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                  className={`px-3 py-2.5 ${c.numeric ? "text-right" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className={`font-extrabold ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    {c.label}
                    <span className="ml-1 text-xs">{active ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              );
            })}
            <th scope="col" className="px-3 py-2.5 text-right text-xs font-extrabold text-gray-500">
              Add
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
            const d = proteinDensity(m);
            const focused = m.id === focusItemId;
            return (
              <tr
                key={m.id}
                ref={focused ? (el) => { focusRef.current = el; } : undefined}
                className={`border-b border-gray-200 last:border-b-0 ${focused ? "bg-[#e8f0fe]" : "hover:bg-[#fbfaf7]"}`}
              >
                <td className="px-3 py-2">
                  <span className="font-semibold text-gray-900">{m.name}</span>
                  {needsCheck(m) && <span className="ml-1 text-amber-500" title="Unverified values">⚠</span>}
                  <span className="block text-xs text-gray-500">
                    {m.menuCategory}
                    {m.servingSize && ` · ${m.servingSize}`}
                  </span>
                </td>
                <Num v={m.calories} bold />
                <Num v={m.protein} />
                <Num v={m.carbs} />
                <Num v={m.fat} />
                <Num v={d != null ? Number(d.toFixed(1)) : null} />
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <ItemActions item={toTrayItem(m, restaurant.name, restaurant.slug)} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Num({ v, bold }: { v: number | null; bold?: boolean }) {
  return (
    <td className={`px-3 py-2 text-right tabular-nums ${bold ? "font-bold text-gray-900" : "text-gray-700"}`}>
      {v ?? "–"}
    </td>
  );
}

function MenuSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-36 bg-gray-200/60" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden h-96 rounded-xl bg-gray-200 lg:block" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
