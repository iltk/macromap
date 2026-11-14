import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import type { MapRef } from "react-map-gl/maplibre";
import { fetchRestaurants } from "../api/venues";
import { SiteHeader } from "../components/layout/SiteHeader";
import { MapContainer } from "../components/map/MapContainer";
import { HAS_MAP_KEY } from "../components/map/mapStyles";
import { MapFilters } from "../components/place/MapFilters";
import { NearbyList } from "../components/place/NearbyList";
import { PlaceDetails, type PlaceTab } from "../components/place/PlaceDetails";
import { SearchBar } from "../components/search/SearchBar";
import { Toast } from "../components/ui/Toast";
import { Icon } from "../components/ui/icons";
import { useApi } from "../hooks/useApi";
import { useGeolocation } from "../hooks/useGeolocation";
import { useLocationDetails } from "../hooks/useLocationDetails";
import { useNow } from "../hooks/useNow";
import { useToast } from "../hooks/useToast";
import { useVenueData } from "../hooks/useVenueData";
import { addRecent, toPlaceRef, type PlaceRef } from "../stores/places";
import { usePrefs } from "../stores/prefs";
import type { Coordinates, MenuItemHit, RestaurantHit, Venue } from "../types/venues";
import { applyMapFilters, type MapFilterState } from "../utils/filter";
import { TORONTO, distanceMeters, nearest } from "../utils/geo";
import { limitsToQuery } from "../utils/goals";
import { getOpenStatus } from "../utils/openingHours";

const COVERAGE_RADIUS_M = 60_000;
const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

export function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenueData();
  const { coords: userPosition } = useGeolocation();
  const now = useNow();
  const prefs = usePrefs();
  const toast = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("place"));
  const [tab, setTab] = useState<PlaceTab>("menu");
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [scrollToFocus, setScrollToFocus] = useState(true);
  const [filters, setFilters] = useState<MapFilterState>(() => ({
    openNow: false,
    category: null,
    chain: searchParams.get("chain"),
  }));
  const [center, setCenter] = useState<Coordinates>(TORONTO);
  const [mapReady, setMapReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(() => Boolean(searchParams.get("place")));
  const { details, isLoading, error, retry } = useLocationDetails(selectedId);

  const pendingFly = useRef<string | null>(selectedId);
  const [initialChain] = useState(() => (!selectedId ? filters.chain : null));
  const pendingFitChain = useRef<string | null>(initialChain);
  const centeredOnUser = useRef(Boolean(selectedId) || initialChain !== null);

  useEffect(() => {
    document.title = "MacroMap";
  }, []);

  // ----- data derived from filters and preferences -----
  const isOpen = useCallback((v: Venue) => getOpenStatus(v.openingHours, now)?.open === true, [now]);
  const visibleVenues = useMemo(() => applyMapFilters(venues, filters, isOpen), [venues, filters, isOpen]);
  const hiddenUnknownHours = useMemo(
    () => (filters.openNow ? applyMapFilters(venues, { ...filters, openNow: false }, () => true).filter((v) => !getOpenStatus(v.openingHours, now)).length : 0),
    [venues, filters, now],
  );

  const goalQuery = limitsToQuery(prefs.limits);
  const goalStats = useApi(prefs.goalActive ? `restaurants?${goalQuery}` : null, (signal) => fetchRestaurants(goalQuery, signal), {
    keepPrevious: true,
  });
  const fitsBySlug = useMemo(
    () => (prefs.goalActive && goalStats.data ? new Map(goalStats.data.map((r) => [r.slug, r.matchingItems] as const)) : null),
    [prefs.goalActive, goalStats.data],
  );

  const selectedVenue: Venue | null = useMemo(() => {
    if (!selectedId) return null;
    return venues.find((v) => v.locationId === selectedId) ?? (details?.locationId === selectedId ? { ...details } : null);
  }, [selectedId, venues, details]);

  // ----- camera -----
  const flyTo = useCallback((lat: number, lng: number, zoom = 15) => {
    const map = mapRef.current;
    if (!map) return;
    const bottom = isDesktop() ? 0 : (sheetRef.current?.offsetHeight ?? 0);
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), zoom), padding: { top: 0, left: 0, right: 0, bottom }, duration: 800, essential: true });
  }, []);

  const selectLocation = useCallback(
    (id: string | null, opts: { tab?: PlaceTab; focusItemId?: string | null; scroll?: boolean } = {}) => {
      setSelectedId(id);
      setTab(opts.tab ?? "menu");
      setFocusItemId(opts.focusItemId ?? null);
      setScrollToFocus(opts.scroll ?? true);
      if (!id) return;
      setSheetOpen(true);
      const pin = venues.find((v) => v.locationId === id);
      if (pin) flyTo(pin.latitude, pin.longitude);
      else pendingFly.current = id;
    },
    [venues, flyTo],
  );

  useEffect(() => {
    if (details) addRecent(toPlaceRef(details));
  }, [details]);

  useEffect(() => {
    if (mapReady && details && pendingFly.current === details.locationId) {
      pendingFly.current = null;
      flyTo(details.latitude, details.longitude);
    }
  }, [mapReady, details, flyTo]);

  useEffect(() => {
    if (!mapReady || !userPosition || centeredOnUser.current) return;
    centeredOnUser.current = true;
    if (distanceMeters(userPosition, TORONTO) <= COVERAGE_RADIUS_M) {
      mapRef.current?.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 15, duration: 1000 });
    }
  }, [mapReady, userPosition]);

  useEffect(() => {
    const slug = pendingFitChain.current;
    if (!mapReady || !slug || venues.length === 0) return;
    pendingFitChain.current = null;
    const pts = venues.filter((v) => v.slug === slug && distanceMeters({ lat: v.latitude, lng: v.longitude }, TORONTO) <= COVERAGE_RADIUS_M);
    if (pts.length === 0) return;
    const lngs = pts.map((p) => p.longitude);
    const lats = pts.map((p) => p.latitude);
    mapRef.current?.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60, maxZoom: 15, duration: 800 },
    );
  }, [mapReady, venues]);

  // ----- URL: ?place= and ?chain= -----
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (selectedId) next.set("place", selectedId);
        else next.delete("place");
        if (filters.chain) next.set("chain", filters.chain);
        else next.delete("chain");
        next.delete("goal"); // legacy: goals now live in Preferences
        return next;
      },
      { replace: true },
    );
  }, [selectedId, filters.chain, setSearchParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement) && !document.querySelector('[role="dialog"]')) selectLocation(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectLocation]);

  // ----- search -----
  const origin = (): Coordinates =>
    userPosition && distanceMeters(userPosition, TORONTO) <= COVERAGE_RADIUS_M ? userPosition : center;

  const handleSelectRestaurant = (hit: RestaurantHit) => {
    setFilters((f) => ({ ...f, chain: hit.slug }));
    const target = nearest(venues.filter((v) => v.slug === hit.slug), origin());
    if (target) selectLocation(target.locationId);
  };
  const handleSelectItem = (hit: MenuItemHit) => {
    const target = nearest(venues.filter((v) => v.slug === hit.restaurantSlug), origin());
    if (target) selectLocation(target.locationId, { focusItemId: hit.id });
    else toast.show(`No ${hit.restaurantName} locations on the map`);
  };
  const handleSelectPlace = (place: PlaceRef) => {
    if (venues.some((v) => v.locationId === place.locationId)) selectLocation(place.locationId);
    else {
      setSelectedId(place.locationId);
      setSheetOpen(true);
      flyTo(place.latitude, place.longitude);
    }
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
    const url = `${window.location.origin}/?place=${selectedId}`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) navigator.share({ title: details?.name ?? "MacroMap", url }).catch(() => {});
    else void copy(url, "Link copied");
  };

  const outsideCoverage = userPosition !== null && distanceMeters(userPosition, TORONTO) > COVERAGE_RADIUS_M;

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden">
      <SiteHeader fullWidth />
      <div className="relative flex min-h-0 flex-1">
        {/* panel: left column on desktop, bottom sheet on mobile */}
        <aside
          ref={sheetRef}
          aria-label="Places"
          className={`absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-xl border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-[height] duration-200 md:static md:h-auto md:w-[400px] md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:shadow-none ${
            sheetOpen ? "h-[68%]" : "h-[124px]"
          }`}
        >
          <button
            type="button"
            onClick={() => setSheetOpen((o) => !o)}
            aria-label={sheetOpen ? "Collapse list" : "Expand list"}
            className="flex justify-center pt-2 pb-1 md:hidden"
          >
            <span className="h-1 w-10 rounded-full bg-gray-300" />
          </button>
          <div className="space-y-2 border-b border-gray-200 px-3 pt-1 pb-3 md:pt-3">
            <SearchBar onSelectRestaurant={handleSelectRestaurant} onSelectItem={handleSelectItem} onSelectPlace={handleSelectPlace} />
            <MapFilters venues={venues} value={filters} onChange={setFilters} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {selectedId ? (
              <PlaceDetails
                details={details}
                isLoading={isLoading}
                error={error}
                onRetry={retry}
                onBack={() => selectLocation(null)}
                userPosition={userPosition}
                tab={tab}
                onTabChange={setTab}
                focusItemId={focusItemId}
                scrollToFocus={scrollToFocus}
                onShare={handleShare}
                onCopy={copy}
              />
            ) : (
              <NearbyList
                venues={visibleVenues}
                center={center}
                userPosition={userPosition}
                now={now}
                onPick={(id, itemId) => selectLocation(id, { focusItemId: itemId, scroll: false })}
              />
            )}
          </div>
        </aside>

        <div className="absolute inset-0 md:relative md:inset-auto md:flex-1">
          <MapContainer
            mapRef={mapRef}
            userPosition={userPosition}
            venues={visibleVenues}
            selectedVenue={selectedVenue}
            fitsBySlug={fitsBySlug}
            onSelectVenue={(id) => selectLocation(id)}
            onReady={() => setMapReady(true)}
            onCenterChange={setCenter}
            onLocateMe={() => userPosition && mapRef.current?.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 15, duration: 800 })}
          />
          <div className="pointer-events-none absolute top-3 left-3 flex max-w-[60%] flex-col items-start gap-1.5">
            {venuesLoading && <Note>Loading places…</Note>}
            {!HAS_MAP_KEY && <Note>Missing VITE_MAPTILER_KEY in web/.env.local</Note>}
            {outsideCoverage && <Note>MacroMap covers Toronto for now</Note>}
            {fitsBySlug && (
              <Note>
                <Icon name="tune" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                Faded pins have nothing for {prefs.goalName?.toLowerCase()}
              </Note>
            )}
            {filters.openNow && hiddenUnknownHours > 0 && <Note>{hiddenUnknownHours} places hidden: hours unknown</Note>}
          </div>
        </div>
      </div>

      <Toast message={venuesError ? "Couldn't load places. Is the API running?" : null} tone="error" />
      <Toast message={toast.message} />
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-gray-200 bg-white/95 px-2.5 py-1 text-xs text-gray-700 shadow-sm">{children}</span>;
}
