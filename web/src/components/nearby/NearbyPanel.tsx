import { useMemo, useState } from "react";
import { useChainMenus } from "../../hooks/useChainMenus";
import { useAvoidList } from "../../stores/allergens";
import type { Coordinates, Venue } from "../../types/venues";
import { distanceMeters, formatDistance } from "../../utils/geo";
import type { Goal } from "../../utils/goals";
import { bestPick, proteinDensity } from "../../utils/macros";
import { getOpenStatus } from "../../utils/openingHours";
import { RestaurantLogo } from "../restaurants/RestaurantLogo";
import { Icon } from "../ui/icons";

const MAX_RESULTS = 25;
const RADII_M = [1500, 3000, 6000, 15000];

type SortKey = "pick" | "distance";

export interface NearbyPick {
  locationId: string;
  itemId: string | null;
}

export function NearbyPanel({
  venues,
  origin,
  originIsUser,
  goal,
  now,
  onPick,
  onClose,
}: {
  venues: Venue[];
  origin: Coordinates;
  originIsUser: boolean;
  goal: Goal;
  now: Date;
  onPick: (pick: NearbyPick) => void;
  onClose: () => void;
}) {
  const [sort, setSort] = useState<SortKey>("pick");
  const avoid = useAvoidList();

  // nearest places, widening the radius until there are enough to choose from
  const nearby = useMemo(() => {
    const withDistance = venues
      .map((v) => ({ venue: v, distance: distanceMeters(origin, { lat: v.latitude, lng: v.longitude }) }))
      .sort((a, b) => a.distance - b.distance);
    const radius = RADII_M.find((r) => withDistance.filter((d) => d.distance <= r).length >= 8) ?? RADII_M.at(-1)!;
    return { radius, places: withDistance.filter((d) => d.distance <= radius).slice(0, MAX_RESULTS) };
  }, [venues, origin]);

  const { menus, isLoading } = useChainMenus(nearby.places.map((p) => p.venue.slug));

  const rows = useMemo(() => {
    const list = nearby.places.map((p) => {
      const menu = menus.get(p.venue.slug)?.menu;
      return {
        ...p,
        hasMenu: menu !== undefined && menu.length > 0,
        pick: menu ? bestPick(menu, goal, avoid) : null,
        status: getOpenStatus(p.venue.openingHours, now),
      };
    });
    if (sort === "distance") return list;
    return [...list].sort(
      (a, b) =>
        Number(Boolean(b.pick)) - Number(Boolean(a.pick)) ||
        (proteinDensity(b.pick ?? { protein: null, calories: null }) ?? 0) -
          (proteinDensity(a.pick ?? { protein: null, calories: null }) ?? 0) ||
        a.distance - b.distance,
    );
  }, [nearby.places, menus, goal, avoid, now, sort]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
              <Icon name="trophy" className="h-5 w-5 text-[#f9ab00]" />
              Best near {originIsUser ? "you" : "here"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {rows.length} places within {formatDistance(nearby.radius)} ·{" "}
              {goal.id === "any" ? "best protein per calorie" : `best for ${goal.label.toLowerCase()} (${goal.rule})`}
              {avoid.length > 0 && ` · avoiding ${avoid.length} allergen${avoid.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-1 rounded-full bg-gray-100 p-1 text-sm">
          {(
            [
              ["pick", "Best pick"],
              ["distance", "Nearest"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              aria-pressed={sort === k}
              className={`flex-1 rounded-full py-1 ${sort === k ? "bg-white font-semibold text-gray-900 shadow-sm" : "text-gray-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ol className="flex-1 divide-y divide-gray-100 overflow-y-auto">
        {rows.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-gray-500">No places match your filters nearby.</li>
        )}
        {rows.map(({ venue, distance, hasMenu, pick, status }) => (
          <li key={venue.locationId}>
            <button
              type="button"
              onClick={() => onPick({ locationId: venue.locationId, itemId: pick?.id ?? null })}
              className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-gray-50"
            >
              <RestaurantLogo name={venue.name} brandColor={venue.brandColor} category={venue.category} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-gray-900">{venue.name}</span>
                  <span className="shrink-0 text-xs text-gray-500 tabular-nums">{formatDistance(distance)}</span>
                </span>
                {status && (
                  <span className={`block text-xs ${status.open ? "text-success-ink" : "text-danger-ink"}`}>{status.label}</span>
                )}
                <span className="mt-1 block text-sm">
                  {pick ? (
                    <>
                      <span className="text-gray-500">Best pick: </span>
                      <span className="font-medium text-gray-900">{pick.name}</span>
                      <span className="block text-xs text-gray-500 tabular-nums">
                        {pick.calories} kcal · {pick.protein} g protein · {proteinDensity(pick)?.toFixed(1)} g / 100 kcal
                      </span>
                    </>
                  ) : isLoading && !menus.has(venue.slug) ? (
                    <span className="text-xs text-gray-400">Checking the menu…</span>
                  ) : hasMenu ? (
                    <span className="text-xs text-gray-500">
                      Nothing on this menu fits your goal{avoid.length > 0 && " and allergen filter"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No nutrition data yet</span>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
