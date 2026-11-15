import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { fetchRestaurantMenu, fetchRestaurants } from "../api/venues";
import { MenuPicker } from "../components/build/MenuPicker";
import { OrderReceipt } from "../components/build/OrderReceipt";
import { RestaurantPicker } from "../components/build/RestaurantPicker";
import { SavedOrders } from "../components/build/SavedOrders";
import { SiteHeader } from "../components/layout/SiteHeader";
import { Icon } from "../components/ui/icons";
import { ui } from "../components/ui/styles";
import { useApi } from "../hooks/useApi";
import { totalsOf, useTracker } from "../stores/tracker";
import type { MenuItem } from "../types/venues";

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

  // swap hints need the full menu; only the open restaurant's is loaded
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
          <SavedOrders title="Your saved orders" />
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
