import { useMemo, useState } from "react";
import { useChainMenus } from "../../hooks/useChainMenus";
import { usePrefs } from "../../stores/prefs";
import type { Coordinates, Venue } from "../../types/venues";
import { distanceMeters, formatDistance } from "../../utils/geo";
import { bestPick, proteinDensity } from "../../utils/macros";
import { getOpenStatus } from "../../utils/openingHours";
import { RestaurantLogo } from "../restaurants/RestaurantLogo";
import { ui } from "../ui/styles";

const MAX_RESULTS = 30;
const RADII_M = [1000, 2000, 4000, 8000, 20000];

type SortKey = "match" | "distance";

/** Places around the map centre, each with its best menu item for the viewer's preferences. */
export function NearbyList({
  venues,
  center,
  userPosition,
  now,
  onPick,
}: {
  venues: Venue[];
  center: Coordinates;
  userPosition: Coordinates | null;
  now: Date;
  onPick: (locationId: string, itemId: string | null) => void;
}) {
  const prefs = usePrefs();
  const [sortChoice, setSortChoice] = useState<SortKey | null>(null);
  // without a goal or allergens there's nothing to "match", so closest first
  const sort: SortKey = prefs.active ? (sortChoice ?? "match") : "distance";

  const nearby = useMemo(() => {
    const all = venues
      .map((v) => ({ venue: v, d: distanceMeters(center, { lat: v.latitude, lng: v.longitude }) }))
      .sort((a, b) => a.d - b.d);
    const radius = RADII_M.find((r) => all.filter((x) => x.d <= r).length >= 10) ?? RADII_M[RADII_M.length - 1];
    return all.filter((x) => x.d <= radius).slice(0, MAX_RESULTS).map((x) => x.venue);
  }, [venues, center]);

  const { menus, isLoading } = useChainMenus(nearby.map((v) => v.slug));

  const rows = useMemo(() => {
    const goal = { id: "", label: "", rule: "", limits: prefs.limits };
    const list = nearby.map((v) => {
      const menu = menus.get(v.slug)?.menu;
      return {
        venue: v,
        distance: distanceMeters(userPosition ?? center, { lat: v.latitude, lng: v.longitude }),
        hasMenu: Boolean(menu && menu.length),
        loaded: menu !== undefined,
        menuSize: menu?.length ?? 0,
        pick: menu && prefs.active ? bestPick(menu, goal, prefs.avoid) : null,
        status: getOpenStatus(v.openingHours, now),
      };
    });
    if (sort === "distance") return [...list].sort((a, b) => a.distance - b.distance);
    return [...list].sort(
      (a, b) =>
        Number(Boolean(b.pick)) - Number(Boolean(a.pick)) ||
        (b.pick ? proteinDensity(b.pick) ?? 0 : 0) - (a.pick ? proteinDensity(a.pick) ?? 0 : 0) ||
        a.distance - b.distance,
    );
  }, [nearby, menus, prefs.limits, prefs.avoid, prefs.active, userPosition, center, now, sort]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{rows.length} places</span> in this area
        </p>
        {prefs.active ? (
          <select value={sort} onChange={(e) => setSortChoice(e.target.value as SortKey)} aria-label="Sort places" className={`${ui.select} h-8`}>
            <option value="match">Best match first</option>
            <option value="distance">Closest first</option>
          </select>
        ) : (
          <span className="text-xs text-gray-500">Closest first</span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-gray-600">No places match your filters here. Try zooming out or clearing filters.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {rows.map(({ venue, distance, hasMenu, loaded, pick, status, menuSize }) => (
            <li key={venue.locationId}>
              <button
                type="button"
                onClick={() => onPick(venue.locationId, pick?.id ?? null)}
                className="flex w-full gap-3 px-4 py-3 text-left hover:bg-row-hover"
              >
                <RestaurantLogo name={venue.name} brandColor={venue.brandColor} category={venue.category} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-gray-900">{venue.name}</span>
                    <span className="shrink-0 text-xs text-gray-500 tabular-nums">{formatDistance(distance)}</span>
                  </span>
                  {status && (
                    <span className={`block text-xs ${status.open ? "text-success-ink" : "text-danger-ink"}`}>{status.label}</span>
                  )}
                  <span className="mt-1 block text-xs text-gray-600">
                    {pick ? (
                      <>
                        <span className="text-gray-900">{pick.name}</span>
                        <span className="tabular-nums">
                          {" "}· {pick.calories} cal · <span className="text-accent-ink">{pick.protein} g protein</span>
                        </span>
                      </>
                    ) : !loaded && isLoading ? (
                      <span className="text-gray-400">Checking menu…</span>
                    ) : hasMenu && !prefs.active ? (
                      <span className="text-gray-600">{menuSize} menu items with nutrition info</span>
                    ) : hasMenu ? (
                      <span className="text-gray-500">Nothing here matches your preferences</span>
                    ) : (
                      <span className="text-gray-400">No nutrition info yet</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
