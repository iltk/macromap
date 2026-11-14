import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { fetchRestaurantMenu } from "../api/venues";
import { SiteHeader } from "../components/layout/SiteHeader";
import { MenuList } from "../components/menu/MenuList";
import { MenuToolbar } from "../components/menu/MenuToolbar";
import { TopPick } from "../components/menu/TopPick";
import { AllergenNotice } from "../components/restaurants/AllergenNotice";
import { RestaurantLogo } from "../components/restaurants/RestaurantLogo";
import { Icon } from "../components/ui/icons";
import { ui } from "../components/ui/styles";
import { useApi } from "../hooks/useApi";
import { usePrefs } from "../stores/prefs";
import type { RestaurantMenu } from "../types/venues";
import { bestPick } from "../utils/macros";
import { DEFAULT_QUERY, menuSections, queryMenu, type MenuQuery } from "../utils/menuQuery";

export function RestaurantMenuPage() {
  const { slug = "" } = useParams();
  const { data, error, isLoading, retry } = useApi(`menu:${slug}`, (signal) => fetchRestaurantMenu(slug, signal));

  useEffect(() => {
    if (data) document.title = `${data.name} menu: calories and macros · MacroMap`;
  }, [data]);

  return (
    <div className="min-h-dvh bg-page">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-5">
        <Link to="/restaurants" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <Icon name="arrowBack" className="h-4 w-4" />
          Restaurants
        </Link>
        {error ? (
          <div className="mt-6 text-sm">
            <p className="text-gray-900">{error === "Not found" ? "We couldn't find that restaurant." : "Couldn't load this menu."}</p>
            {error !== "Not found" && (
              <button type="button" onClick={retry} className={`mt-3 ${ui.btn}`}>
                Try again
              </button>
            )}
          </div>
        ) : isLoading || !data ? (
          <div className="mt-6 h-72 animate-pulse rounded-lg border border-gray-200 bg-white" aria-label="Loading" />
        ) : (
          <MenuView key={data.slug} restaurant={data} />
        )}
      </main>
    </div>
  );
}

function MenuView({ restaurant }: { restaurant: RestaurantMenu }) {
  const [searchParams] = useSearchParams();
  const prefs = usePrefs();
  const [query, setQuery] = useState<MenuQuery>(DEFAULT_QUERY);
  const [focusItemId, setFocusItemId] = useState<string | null>(() => searchParams.get("item"));
  const { menu } = restaurant;

  const result = useMemo(
    () => queryMenu(menu, { ...query, onlyFits: prefs.goalActive && query.onlyFits }, prefs.limits, prefs.avoid),
    [menu, query, prefs.goalActive, prefs.limits, prefs.avoid],
  );
  const pick = useMemo(() => bestPick(menu, { id: "", label: "", rule: "", limits: prefs.limits }, prefs.avoid), [menu, prefs.limits, prefs.avoid]);

  return (
    <>
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <RestaurantLogo name={restaurant.name} brandColor={restaurant.brandColor} category={restaurant.category} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            {restaurant.description && <p className="mt-0.5 text-gray-600">{restaurant.description}</p>}
            <p className="mt-1 text-sm text-gray-500">
              {menu.length} menu items · {restaurant.locationCount} locations in Toronto
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/?chain=${restaurant.slug}`} className={ui.btnPrimary}>
            <Icon name="place" className="h-4 w-4" />
            View on map
          </Link>
          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noreferrer" className={ui.btn}>
              Website
            </a>
          )}
        </div>
      </header>

      {menu.length === 0 ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <p className="font-medium text-gray-900">No nutrition info yet</p>
          <p className="mt-1 text-sm text-gray-600">
            We haven't added {restaurant.name}'s menu yet. You can still find its locations on the map.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="space-y-3">
            <MenuToolbar
              layout="row"
              query={query}
              onChange={setQuery}
              sections={menuSections(menu)}
              total={menu.length}
              shown={result.items.length}
              fitCount={result.fitCount}
              placeholder={`Search ${restaurant.name}'s menu`}
            />
            <AllergenNotice {...result.hidden} />
          </div>

          <div className="min-w-0 space-y-3">
            {pick && prefs.goalActive && <TopPick item={pick} forGoal={prefs.goalName} onShow={() => setFocusItemId(pick.id)} />}
            {result.items.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
                Nothing on this menu matches. Try another section or clear the search.
              </div>
            ) : (
              <MenuList
                items={result.items}
                sort={query.sort}
                onSort={(sort) => setQuery((q) => ({ ...q, sort }))}
                restaurantName={restaurant.name}
                restaurantSlug={restaurant.slug}
                focusItemId={focusItemId}
                layout="table"
              />
            )}
            <p className="text-xs text-gray-500">
              Values are approximate, from published restaurant nutrition information. Items marked with a warning
              have numbers that don't add up in the source.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
