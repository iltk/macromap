import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { fetchRestaurantMenu, fetchRestaurants } from "../api/venues";
import { OrderReceipt } from "../components/build/OrderReceipt";
import { SavedOrders } from "../components/build/SavedOrders";
import { SiteHeader } from "../components/layout/SiteHeader";
import { FoodImage } from "../components/media/FoodImage";
import { AllergenNotice } from "../components/restaurants/AllergenNotice";
import { RestaurantLogo } from "../components/restaurants/RestaurantLogo";
import { Icon } from "../components/ui/icons";
import { ui } from "../components/ui/styles";
import { useApi } from "../hooks/useApi";
import { usePrefs } from "../stores/prefs";
import { addToPlan, setPlanQty, totalsOf, useTracker } from "../stores/tracker";
import { toTrayItem } from "../stores/tray";
import { openSheet } from "../stores/ui";
import { PrefsNote } from "../components/ui/PrefsNote";
import type { MenuItem, RestaurantMenu, RestaurantSummary } from "../types/venues";
import { needsCheck } from "../utils/macros";
import { DEFAULT_QUERY, menuSections, queryMenu } from "../utils/menuQuery";
import { EmptyState } from "../components/ui/EmptyState";

export function BuildPage() {
  const [params, setParams] = useSearchParams();
  const slug = params.get("r");
  const restaurants = useApi("restaurants?", (signal) => fetchRestaurants("", signal));
  const menu = useApi(slug ? `menu:${slug}` : null, (signal) => fetchRestaurantMenu(slug!, signal));
  const { plan } = useTracker();
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const totals = totalsOf(plan);

  useEffect(() => {
    document.title = "Build a meal · MacroMap";
  }, []);

  // menus for every restaurant in the order (for swap hints), plus the open one
  const menus = useMemo(() => {
    const m = new Map<string, MenuItem[]>();
    if (menu.data) m.set(menu.data.slug, menu.data.menu);
    return m;
  }, [menu.data]);

  const choose = (s: string | null) => setParams(s ? { r: s } : {}, { replace: false });

  return (
    <div className="min-h-dvh bg-page pb-24 lg:pb-0">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-5">
        <h1 className="text-2xl font-bold text-gray-900">Build a meal</h1>
        <p className="mt-1 text-gray-600">Put together an order and watch the calories and macros add up before you buy.</p>

        {!slug ? (
          <>
          <SavedOrdersSection />
          <RestaurantPicker restaurants={restaurants.data} loading={restaurants.isLoading} onChoose={choose} />
          </>
        ) : (
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              {menu.error ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm">
                  <p className="text-gray-900">Couldn't load this menu.</p>
                  <button type="button" onClick={() => choose(null)} className={`mt-3 ${ui.btn}`}>
                    Pick another restaurant
                  </button>
                </div>
              ) : !menu.data ? (
                <div className="h-96 animate-pulse rounded-xl border border-gray-200 bg-white" />
              ) : (
                <MenuPicker restaurant={menu.data} restaurants={restaurants.data ?? []} onChange={choose} />
              )}
            </div>
            <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <h2 className="border-b border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900">Your order</h2>
                <OrderReceipt menus={menus} />
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* phones: pinned summary that opens the full receipt */}
      {plan.length > 0 && (
        <button
          type="button"
          onClick={() => setMobileOrderOpen(true)}
          className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg lg:hidden"
        >
          <span>
            {totals.count} {totals.count === 1 ? "item" : "items"} · <span className="font-semibold tabular-nums">{Math.round(totals.calories)} cal</span>
          </span>
          <span className="font-medium">View order</span>
        </button>
      )}
      {mobileOrderOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="Your order">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-5">
            <h2 className="font-semibold text-gray-900">Your order</h2>
            <button type="button" onClick={() => setMobileOrderOpen(false)} aria-label="Close" className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100">
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <OrderReceipt menus={menus} />
          </div>
        </div>
      )}
    </div>
  );
}

function SavedOrdersSection() {
  const { savedOrders } = useTracker();
  if (savedOrders.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-base font-semibold text-gray-900">Your saved orders</h2>
      <SavedOrders />
    </section>
  );
}

function RestaurantPicker({
  restaurants,
  loading,
  onChoose,
}: {
  restaurants: RestaurantSummary[] | null;
  loading: boolean;
  onChoose: (slug: string) => void;
}) {
  const sorted = [...(restaurants ?? [])].sort((a, b) => Number(b.menuItemCount > 0) - Number(a.menuItemCount > 0) || a.name.localeCompare(b.name));
  return (
    <section className="mt-8">
      <ol className="mb-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
        <li>
          <span className="font-semibold text-gray-900">1.</span> Pick a place
        </li>
        <li>
          <span className="font-semibold text-gray-900">2.</span> Add what you'd order
        </li>
        <li>
          <span className="font-semibold text-gray-900">3.</span> Check the totals, log it if you eat it
        </li>
      </ol>
      {loading && !restaurants ? (
        <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white" />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((r) => {
            const ready = r.menuItemCount > 0;
            return (
              <li key={r.slug}>
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => onChoose(r.slug)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-gray-200"
                >
                  <RestaurantLogo name={r.name} brandColor={r.brandColor} category={r.category} logoUrl={r.logoUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900">{r.name}</span>
                    <span className="block text-xs text-gray-500">{ready ? `${r.menuItemCount} items` : "Menu coming soon"}</span>
                  </span>
                  {ready && <Icon name="chevronRight" className="h-5 w-5 text-gray-400" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MenuPicker({ restaurant, restaurants, onChange }: { restaurant: RestaurantMenu; restaurants: RestaurantSummary[]; onChange: (slug: string | null) => void }) {
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
      <div className="no-scrollbar mt-3 flex gap-1 overflow-x-auto border-b border-gray-200" role="tablist" aria-label="Menu sections">
        {[["all", restaurant.menu.length] as [string, number], ...sections].map(([s, n]) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={section === s}
            onClick={() => setSection(s)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap ${section === s ? "border-gray-900 font-semibold text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"}`}
          >
            {s === "all" ? "Everything" : s} <span className="text-xs text-gray-400">{n}</span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        <AllergenNotice {...result.hidden} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState size="sm" art="plate" title="Nothing matches" text="Try another section or clear the search." />
      ) : (
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {result.items.map((m) => {
            const qty = qtyOf(m.id);
            const tray = toTrayItem(m, restaurant.name, restaurant.slug);
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
                  <button type="button" onClick={() => addToPlan(tray)} aria-label={`Add ${m.name} to order`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900">
                    <Icon name="add" className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="flex shrink-0 items-center rounded-full bg-accent text-white">
                    <button type="button" onClick={() => setPlanQty(m.id, qty - 1)} aria-label={`One less ${m.name}`} className="p-1.5">
                      <Icon name="remove" className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm font-semibold tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setPlanQty(m.id, qty + 1)} aria-label={`One more ${m.name}`} className="p-1.5">
                      <Icon name="add" className="h-3.5 w-3.5" />
                    </button>
                  </span>
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
