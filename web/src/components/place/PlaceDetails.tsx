import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CATEGORY_LABELS } from "../../constants/categories";
import { usePrefs } from "../../stores/prefs";
import { toPlaceRef, toggleSaved, useSavedPlaces } from "../../stores/places";
import type { Coordinates, LocationDetails } from "../../types/venues";
import { distanceMeters, formatDistance } from "../../utils/geo";
import { bestPick } from "../../utils/macros";
import { DEFAULT_QUERY, menuSections, queryMenu, type MenuQuery } from "../../utils/menuQuery";
import { getOpenStatus } from "../../utils/openingHours";
import { MenuList } from "../menu/MenuList";
import { MenuToolbar } from "../menu/MenuToolbar";
import { TopPick } from "../menu/TopPick";
import { AllergenNotice } from "../restaurants/AllergenNotice";
import { RestaurantLogo } from "../restaurants/RestaurantLogo";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";
import { PlaceInfo } from "./PlaceInfo";

export type PlaceTab = "menu" | "info";

interface Props {
  details: LocationDetails | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  userPosition: Coordinates | null;
  tab: PlaceTab;
  onTabChange: (t: PlaceTab) => void;
  focusItemId: string | null;
  scrollToFocus: boolean;
  onShare: () => void;
  onCopy: (text: string, message: string) => void;
}

export function PlaceDetails(props: Props) {
  const { details, isLoading, error, onRetry, onBack } = props;
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-2 py-1.5">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
          <Icon name="arrowBack" className="h-4 w-4" />
          Nearby
        </button>
      </div>
      {error ? (
        <div className="px-4 py-10 text-sm">
          <p className="font-medium text-gray-900">{error === "Not found" ? "This place no longer exists." : "Couldn't load this place."}</p>
          {error !== "Not found" && (
            <button type="button" onClick={onRetry} className={`mt-3 ${ui.btn}`}>
              Try again
            </button>
          )}
        </div>
      ) : isLoading || !details ? (
        <div className="animate-pulse space-y-3 px-4 py-5" aria-label="Loading">
          <div className="h-6 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-100" />
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-9 rounded bg-gray-100" />
        </div>
      ) : (
        <Loaded {...props} details={details} />
      )}
    </div>
  );
}

function Loaded({ details, userPosition, tab, onTabChange, focusItemId, scrollToFocus, onShare, onCopy }: Props & { details: LocationDetails }) {
  const prefs = usePrefs();
  const [query, setQuery] = useState<MenuQuery>(DEFAULT_QUERY);
  const isSaved = useSavedPlaces().some((p) => p.locationId === details.locationId);
  const status = getOpenStatus(details.openingHours);
  const distance = userPosition ? formatDistance(distanceMeters(userPosition, { lat: details.latitude, lng: details.longitude })) : null;

  const result = useMemo(
    () => queryMenu(details.menu, { ...query, onlyFits: prefs.goalActive && query.onlyFits }, prefs.limits, prefs.avoid),
    [details.menu, query, prefs.goalActive, prefs.limits, prefs.avoid],
  );
  const pick = useMemo(() => bestPick(details.menu, { id: "", label: "", rule: "", limits: prefs.limits }, prefs.avoid), [details.menu, prefs.limits, prefs.avoid]);
  const hasMenu = details.menu.length > 0;
  const activeTab: PlaceTab = hasMenu ? tab : "info";

  return (
    <>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <RestaurantLogo name={details.name} brandColor={details.brandColor} category={details.category} logoUrl={details.logoUrl} />
          <div className="min-w-0">
            <h2 className="text-lg leading-tight font-bold text-gray-900">{details.name}</h2>
            <p className="mt-0.5 text-sm text-gray-600">
              {CATEGORY_LABELS[details.category] ?? "Restaurant"}
              {distance && <> · {distance}</>}
              {status && (
                <>
                  {" · "}
                  <span className={status.open ? "text-success-ink" : "text-danger-ink"}>{status.label}</span>
                </>
              )}
            </p>
            <p className="text-sm text-gray-600">{details.address}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${details.latitude},${details.longitude}`} target="_blank" rel="noreferrer" className={ui.btnPrimary}>
            <Icon name="directions" className="h-4 w-4" />
            Directions
          </a>
          <button type="button" onClick={() => toggleSaved(toPlaceRef(details))} aria-pressed={isSaved} className={ui.btn}>
            <Icon name={isSaved ? "bookmark" : "bookmarkBorder"} className="h-4 w-4" />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button type="button" onClick={onShare} className={ui.btn}>
            <Icon name="share" className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      <div role="tablist" className="flex gap-5 border-b border-gray-200 px-4">
        {(["menu", "info"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={activeTab === t}
            disabled={t === "menu" && !hasMenu}
            onClick={() => onTabChange(t)}
            className={`-mb-px border-b-2 py-2 text-sm ${
              activeTab === t ? "border-gray-900 font-semibold text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900 disabled:text-gray-400"
            }`}
          >
            {t === "menu" ? `Menu${hasMenu ? ` (${details.menu.length})` : ""}` : "Info"}
          </button>
        ))}
      </div>

      {activeTab === "info" ? (
        <>
          {!hasMenu && <p className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600">No nutrition info for {details.name} yet.</p>}
          <PlaceInfo details={details} onCopyAddress={() => onCopy(details.address, "Address copied")} />
        </>
      ) : (
        <>
          <div className="space-y-3 border-b border-gray-200 px-4 py-3">
            {pick && prefs.goalActive && <TopPick item={pick} forGoal={prefs.goalName} />}
            <MenuToolbar
              query={query}
              onChange={setQuery}
              sections={menuSections(details.menu)}
              total={details.menu.length}
              shown={result.items.length}
              fitCount={result.fitCount}
              placeholder={`Search ${details.name}'s menu`}
            />
            <AllergenNotice {...result.hidden} />
            <Link to={`/restaurants/${details.slug}`} className={`inline-block text-sm ${ui.link}`}>
              Open full menu
            </Link>
          </div>
          {result.items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-600">Nothing on this menu matches.</p>
          ) : (
            <MenuList
              items={result.items}
              sort={query.sort}
              restaurantName={details.name}
              restaurantSlug={details.slug}
              focusItemId={focusItemId}
              scrollToFocus={scrollToFocus}
              layout="compact"
            />
          )}
        </>
      )}
    </>
  );
}
