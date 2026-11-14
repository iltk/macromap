import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { MapContainer } from "./components/map/MapContainer";
import { HAS_MAP_KEY } from "./components/map/mapStyles";
import { VenueDetailsPanel, type PanelTab } from "./components/panels/VenueDetailsPanel";
import { FilterChips } from "./components/search/FilterChips";
import { SearchBar } from "./components/search/SearchBar";
import { Toast } from "./components/ui/Toast";
import { useGeolocation } from "./hooks/useGeolocation";
import { useLocationDetails } from "./hooks/useLocationDetails";
import { useToast } from "./hooks/useToast";
import { useVenueData } from "./hooks/useVenueData";
import type { Coordinates, MenuItemHit, RestaurantHit, Venue, VenueFilter } from "./types/venues";
import { applyFilter } from "./utils/filter";
import { TORONTO, distanceMeters, nearest } from "./utils/geo";

const COVERAGE_RADIUS_M = 60_000;
const PANEL_WIDTH = 408;

const readPlaceParam = () => new URLSearchParams(window.location.search).get("place");

function panelPadding() {
  const desktop = window.matchMedia("(min-width: 768px)").matches;
  return desktop
    ? { left: PANEL_WIDTH, top: 0, right: 0, bottom: 0 }
    : { left: 0, top: 0, right: 0, bottom: Math.round(window.innerHeight * 0.62) };
}

function App() {
  const mapRef = useRef<MapRef>(null);
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenueData();
  const { coords: userPosition } = useGeolocation();
  const [selectedId, setSelectedId] = useState<string | null>(readPlaceParam);
  const [tab, setTab] = useState<PanelTab>("overview");
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [filter, setFilter] = useState<VenueFilter>({ kind: "all" });
  const [mapReady, setMapReady] = useState(false);
  const toast = useToast();
  const { details, isLoading, error, retry } = useLocationDetails(selectedId);

  // A deep link (?place=) is flown to once its details arrive; otherwise we centre on the user once.
  const pendingFly = useRef<string | null>(selectedId);
  const centeredOnUser = useRef(Boolean(selectedId));

  const visibleVenues = useMemo(() => applyFilter(venues, filter), [venues, filter]);
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
      padding: panelPadding(),
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

  // Keep ?place= in the URL so the current place can be shared / survives reloads.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("place", selectedId);
    else url.searchParams.delete("place");
    window.history.replaceState(null, "", url);
  }, [selectedId]);

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
    <div className="relative h-dvh w-screen overflow-hidden">
      <MapContainer
        mapRef={mapRef}
        userPosition={userPosition}
        venues={visibleVenues}
        selectedVenue={selectedVenue}
        panelOpen={panelOpen}
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
          <SearchBar onSelectRestaurant={handleSelectRestaurant} onSelectItem={handleSelectItem} />
        </div>
        <div className="pointer-events-auto min-w-0 md:pt-2">
          <FilterChips venues={venues} filter={filter} onChange={setFilter} />
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
        onShare={handleShare}
        onCopy={copy}
      />

      {/* status chips */}
      <div className="pointer-events-none absolute top-[112px] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:top-20">
        {venuesLoading && <StatusChip>Loading restaurants…</StatusChip>}
        {!HAS_MAP_KEY && <StatusChip tone="error">Missing VITE_MAPTILER_KEY in web/.env.local</StatusChip>}
        {outsideCoverage && !panelOpen && <StatusChip>MacroMap covers Toronto for now</StatusChip>}
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

export default App;
