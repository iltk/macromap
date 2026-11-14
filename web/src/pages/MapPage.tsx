import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { SiteHeader } from "../components/layout/SiteHeader";
import type { MapRef } from "react-map-gl/maplibre";
import { MapContainer } from "../components/map/MapContainer";
import { HAS_MAP_KEY } from "../components/map/mapStyles";
import { VenueDetailsPanel, type PanelTab } from "../components/panels/VenueDetailsPanel";
import { FilterChips } from "../components/search/FilterChips";
import { GoalChip } from "../components/search/GoalChip";
import { fetchRestaurants } from "../api/venues";
import { useApi } from "../hooks/useApi";
import { goalById, limitsToQuery } from "../utils/goals";
import { SearchBar } from "../components/search/SearchBar";
import { Toast } from "../components/ui/Toast";
import { useGeolocation } from "../hooks/useGeolocation";
import { useLocationDetails } from "../hooks/useLocationDetails";
import { useNow } from "../hooks/useNow";
import { addRecent, toPlaceRef, type PlaceRef } from "../stores/places";
import { useToast } from "../hooks/useToast";
import { useVenueData } from "../hooks/useVenueData";
import type { Coordinates, MenuItemHit, RestaurantHit, Venue, VenueFilter } from "../types/venues";
import { applyFilter } from "../utils/filter";
import { TORONTO, distanceMeters, nearest } from "../utils/geo";
import { getOpenStatus } from "../utils/openingHours";

const COVERAGE_RADIUS_M = 60_000;
const PANEL_WIDTH = 408;

function panelPadding(mapHeight: number) {
  const desktop = window.matchMedia("(min-width: 768px)").matches;
  return desktop
    ? { left: PANEL_WIDTH, top: 0, right: 0, bottom: 0 }
    : { left: 0, top: 0, right: 0, bottom: Math.round(mapHeight * 0.62) };
}

export function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenueData();
  const { coords: userPosition } = useGeolocation();
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("place"));
  const [tab, setTab] = useState<PanelTab>("overview");
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [filter, setFilter] = useState<VenueFilter>(() => {
    const chain = searchParams.get("chain");
    return chain ? { kind: "chain", slug: chain } : { kind: "all" };
  });
  const [mapReady, setMapReady] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [goal, setGoal] = useState(() => goalById(searchParams.get("goal")));
  const goalQuery = limitsToQuery(goal.limits);
  const goalStats = useApi(
    goal.id === "any" ? null : `restaurants?${goalQuery}`,
    (signal) => fetchRestaurants(goalQuery, signal),
    { keepPrevious: true },
  );
  const fitsBySlug = useMemo(
    () =>
      goal.id === "any" || !goalStats.data
        ? null
        : new Map(goalStats.data.map((r) => [r.slug, r.matchingItems] as const)),
    [goal.id, goalStats.data],
  );
  const now = useNow();
  const toast = useToast();
  const { details, isLoading, error, retry } = useLocationDetails(selectedId);

  // A deep link (?place=) is flown to once its details arrive; otherwise we centre on the user once.
  const pendingFly = useRef<string | null>(selectedId);
  // ?chain= without a place: frame that chain's locations instead of the user.
  const [initialChain] = useState(() =>
    !selectedId && filter.kind === "chain" ? filter.slug : null,
  );
  const pendingFitChain = useRef<string | null>(initialChain);
  const centeredOnUser = useRef(Boolean(selectedId) || initialChain !== null);

  useEffect(() => {
    document.title = "MacroMap · Restaurant macros near you";
  }, []);

  const visibleVenues = useMemo(() => {
    const filtered = applyFilter(venues, filter);
    // "Open now" only keeps places whose posted hours say they're open (unknown hours are hidden).
    return openNow ? filtered.filter((v) => getOpenStatus(v.openingHours, now)?.open === true) : filtered;
  }, [venues, filter, openNow, now]);
  const unknownHoursCount = useMemo(
    () => (openNow ? applyFilter(venues, filter).filter((v) => !getOpenStatus(v.openingHours, now)).length : 0),
    [venues, filter, openNow, now],
  );
  const selectedVenue: Venue | null = useMemo(() => {
    if (!selectedId) return null;
    const pin = venues.find((v) => v.locationId === selectedId);
    if (pin) return pin;
    return details && details.locationId === selectedId
      ? { ...details, category: details.category }
      : null;
  }, [selectedId, venues, details]);

  const flyTo = useCallback((lat: number, lng: number, zoom = 15) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), zoom),
      padding: panelPadding(map.getContainer().clientHeight),
      duration: 900,
      essential: true,
    });
  }, []);

  const selectLocation = useCallback(
    (id: string | null, opts: { tab?: PanelTab; focusItemId?: string | null } = {}) => {
      setSelectedId(id);
      setTab(opts.tab ?? "overview");
      setFocusItemId(opts.focusItemId ?? null);
      if (!id) {
        mapRef.current?.easeTo({ padding: { left: 0, top: 0, right: 0, bottom: 0 }, duration: 300 });
        return;
      }
      const pin = venues.find((v) => v.locationId === id);
      if (pin) flyTo(pin.latitude, pin.longitude);
      else pendingFly.current = id;
    },
    [venues, flyTo],
  );

  // Remember every place that was opened (most recent first).
  useEffect(() => {
    if (details) addRecent(toPlaceRef(details));
  }, [details]);

  // Deep link: fly once we know where the place is.
  useEffect(() => {
    if (mapReady && details && pendingFly.current === details.locationId) {
      pendingFly.current = null;
      flyTo(details.latitude, details.longitude);
    }
  }, [mapReady, details, flyTo]);

  // First fix of the user's position: centre on them if they're inside the covered area.
  useEffect(() => {
    if (!mapReady || !userPosition || centeredOnUser.current) return;
    centeredOnUser.current = true;
    if (distanceMeters(userPosition, TORONTO) <= COVERAGE_RADIUS_M) {
      mapRef.current?.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 14, duration: 1200 });
    }
  }, [mapReady, userPosition]);

  // Frame all locations of a chain when arriving via ?chain=.
  useEffect(() => {
    const slug = pendingFitChain.current;
    if (!mapReady || !slug || venues.length === 0) return;
    pendingFitChain.current = null;
    const pts = venues.filter(
      (v) => v.slug === slug && distanceMeters({ lat: v.latitude, lng: v.longitude }, TORONTO) <= COVERAGE_RADIUS_M,
    );
    if (pts.length === 0) return;
    const lngs = pts.map((p) => p.longitude);
    const lats = pts.map((p) => p.latitude);
    mapRef.current?.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, maxZoom: 15, duration: 900 },
    );
  }, [mapReady, venues]);

  // Keep ?place= and ?chain= in the URL so the view can be shared / survives reloads.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (selectedId) next.set("place", selectedId);
        else next.delete("place");
        if (filter.kind === "chain") next.set("chain", filter.slug);
        else next.delete("chain");
        if (goal.id !== "any") next.set("goal", goal.id);
        else next.delete("goal");
        return next;
      },
      { replace: true },
    );
  }, [selectedId, filter, goal.id, setSearchParams]);

  // Esc closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) selectLocation(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectLocation]);

  const searchOrigin = (): Coordinates => {
    if (userPosition && distanceMeters(userPosition, TORONTO) <= COVERAGE_RADIUS_M) return userPosition;
    const c = mapRef.current?.getCenter();
    return c ? { lat: c.lat, lng: c.lng } : TORONTO;
  };

  const handleSelectRestaurant = (hit: RestaurantHit) => {
    setFilter({ kind: "chain", slug: hit.slug });
    const target = nearest(venues.filter((v) => v.slug === hit.slug), searchOrigin());
    if (target) selectLocation(target.locationId);
  };

  const handleSelectPlace = (place: PlaceRef) => {
    if (venues.some((v) => v.locationId === place.locationId)) selectLocation(place.locationId);
    else {
      // not among the current pins (e.g. filtered out): open it and fly from the stored coords
      setSelectedId(place.locationId);
      setTab("overview");
      flyTo(place.latitude, place.longitude);
    }
  };

  const handleSelectItem = (hit: MenuItemHit) => {
    const target = nearest(venues.filter((v) => v.slug === hit.restaurantSlug), searchOrigin());
    if (target) selectLocation(target.locationId, { tab: "menu", focusItemId: hit.id });
    else toast.show(`No ${hit.restaurantName} locations on the map`);
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.show(message);
    } catch {
      toast.show("Couldn't copy to clipboard");
    }
  };

  const handleShare = () => {
    if (!selectedId) return;
    const url = `${window.location.origin}${window.location.pathname}?place=${selectedId}`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      navigator.share({ title: details?.name ?? "MacroMap", url }).catch(() => {});
    } else {
      void copy(url, "Link copied");
    }
  };

  const outsideCoverage =
    userPosition !== null && distanceMeters(userPosition, TORONTO) > COVERAGE_RADIUS_M;
  const panelOpen = selectedId !== null;

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden">
      <SiteHeader fullWidth />
      {/* everything below positions itself inside the map area, under the header */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MapContainer
          mapRef={mapRef}
          userPosition={userPosition}
          venues={visibleVenues}
          selectedVenue={selectedVenue}
          panelOpen={panelOpen}
          fitsBySlug={fitsBySlug}
          onSelectVenue={(id) => selectLocation(id)}
          onReady={() => setMapReady(true)}
          onLocateMe={() =>
            userPosition &&
            mapRef.current?.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 15, duration: 900 })
          }
        />

        {/* search: floats over the map (and over the panel on desktop, like Google Maps) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 md:flex-row md:items-start md:gap-4 md:px-4">
          <div className="pointer-events-auto md:w-[376px] md:shrink-0">
            <SearchBar
              onSelectRestaurant={handleSelectRestaurant}
              onSelectItem={handleSelectItem}
              onSelectPlace={handleSelectPlace}
            />
          </div>
          <div className="pointer-events-auto min-w-0 md:pt-2">
            <FilterChips
              venues={venues}
              filter={filter}
              onChange={setFilter}
              openNow={openNow}
              onOpenNowChange={setOpenNow}
            >
              <GoalChip goal={goal} onChange={setGoal} />
            </FilterChips>
          </div>
        </div>

        <VenueDetailsPanel
          open={panelOpen}
          details={details}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onClose={() => selectLocation(null)}
          userPosition={userPosition}
          tab={tab}
          onTabChange={setTab}
          focusItemId={focusItemId}
          goal={goal}
          onShare={handleShare}
          onCopy={copy}
        />

        {/* status chips */}
        <div className="pointer-events-none absolute top-[112px] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:top-20">
          {venuesLoading && <StatusChip>Loading restaurants…</StatusChip>}
          {!HAS_MAP_KEY && <StatusChip tone="error">Missing VITE_MAPTILER_KEY in web/.env.local</StatusChip>}
          {outsideCoverage && !panelOpen && <StatusChip>MacroMap covers Toronto for now</StatusChip>}
          {fitsBySlug && !panelOpen && (
            <StatusChip>
              Highlighting places with “{goal.label.toLowerCase()}” options ({goal.rule})
            </StatusChip>
          )}
          {openNow && !panelOpen && (
            <StatusChip>
              {visibleVenues.length} open now
              {unknownHoursCount > 0 && ` · ${unknownHoursCount} hidden (hours unknown)`}
            </StatusChip>
          )}
        </div>

      </div>

      <Toast message={venuesError ? "Couldn't load restaurants. Is the API running?" : null} tone="error" />
      <Toast message={toast.message} />
    </div>
  );
}

function StatusChip({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <span
      className={`rounded-full px-4 py-1.5 text-sm shadow-md ${
        tone === "error" ? "bg-[#d93025] text-white" : "bg-white text-gray-800"
      }`}
    >
      {children}
    </span>
  );
}

