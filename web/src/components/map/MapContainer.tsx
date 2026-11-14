import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Map, {
  AttributionControl,
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point } from "geojson";
import { useResolvedTheme } from "../../stores/theme";
import type { Coordinates, Venue } from "../../types/venues";
import { brandColorFor, initialsFor } from "../../utils/brand";
import { TORONTO } from "../../utils/geo";
import { UserPositionMarker } from "../markers/UserPositionMarker";
import { Icon } from "../ui/icons";
import { MAP_STYLES } from "./mapStyles";
import { registerPinImages, type PinBrand } from "./pinImages";
import {
  INTERACTIVE_LAYERS,
  SELECTED_SOURCE,
  VENUE_SOURCE,
  clusterCountLayer,
  clusterLayer,
  selectedPinLayer,
  venuePinLayer,
} from "./venueLayers";

interface MapContainerProps {
  mapRef: RefObject<MapRef | null>;
  userPosition: Coordinates | null;
  venues: Venue[];
  selectedVenue: Venue | null;
  /** slug -> number of menu items that fit the viewer's goal; null when no goal is set. */
  fitsBySlug: Map<string, number> | null;
  onSelectVenue: (locationId: string | null) => void;
  onLocateMe: () => void;
  onReady: () => void;
  onCenterChange: (c: Coordinates) => void;
}

type VenueProps = Pick<Venue, "locationId" | "name" | "category" | "slug"> & { label: string; dim: boolean };

function pinLabel(v: Venue, fitsBySlug: Map<string, number> | null) {
  if (!fitsBySlug) return { label: v.name, dim: false };
  const fits = fitsBySlug.get(v.slug) ?? 0;
  return { label: fits > 0 ? `${v.name} · ${fits} fit` : v.name, dim: fits === 0 };
}

function toFeatureCollection(venues: Venue[], fitsBySlug: Map<string, number> | null): FeatureCollection<Point, VenueProps> {
  return {
    type: "FeatureCollection",
    features: venues.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
      properties: { locationId: v.locationId, name: v.name, category: v.category, slug: v.slug, ...pinLabel(v, fitsBySlug) },
    })),
  };
}

export function MapContainer({
  mapRef,
  userPosition,
  venues,
  selectedVenue,
  fitsBySlug,
  onSelectVenue,
  onLocateMe,
  onReady,
  onCenterChange,
}: MapContainerProps) {
  const [satellite, setSatellite] = useState(false);
  const [cursor, setCursor] = useState("");
  const dark = useResolvedTheme() === "dark";
  const styleUrl = MAP_STYLES[satellite ? "satellite" : dark ? "streetsDark" : "streets"].url;
  // read by the pin image handler; images are redrawn when the style (theme) changes
  const darkRef = useRef(dark);
  useEffect(() => {
    darkRef.current = dark;
  }, [dark]);

  // slug -> brand, read lazily by the pin image handler (venues load after the map mounts)
  const brands = useRef(new globalThis.Map<string, PinBrand>());
  useEffect(() => {
    for (const v of venues) {
      if (!brands.current.has(v.slug)) {
        brands.current.set(v.slug, { color: brandColorFor(v.brandColor, v.category), initials: initialsFor(v.name) });
      }
    }
  }, [venues]);

  const attachMap = useCallback(
    (instance: MapRef | null) => {
      mapRef.current = instance;
      if (instance)
        registerPinImages(
          instance.getMap(),
          (slug) => brands.current.get(slug),
          () => (darkRef.current ? "#f2f0eb" : "#1d1c19"),
        );
    },
    [mapRef],
  );

  const venueData = useMemo(() => toFeatureCollection(venues, fitsBySlug), [venues, fitsBySlug]);
  const selectedData = useMemo(
    () => toFeatureCollection(selectedVenue ? [selectedVenue] : [], fitsBySlug),
    [selectedVenue, fitsBySlug],
  );
  const pinLayer = useMemo(() => venuePinLayer(selectedVenue?.locationId ?? null, dark), [selectedVenue, dark]);
  const selectedLayer = useMemo(() => selectedPinLayer(dark), [dark]);
  const clusters = useMemo(() => clusterLayer(dark), [dark]);
  const clusterCounts = useMemo(() => clusterCountLayer(dark), [dark]);

  const handleClick = async (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return onSelectVenue(null);
    if (feature.layer.id === "clusters") {
      const source = e.target.getSource(VENUE_SOURCE) as GeoJSONSource | undefined;
      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (!source || clusterId === undefined) return;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const [lng, lat] = (feature.geometry as Point).coordinates;
      e.target.easeTo({ center: [lng, lat], zoom: zoom + 0.5, duration: 500 });
      return;
    }
    const id = feature.properties?.locationId as string | undefined;
    if (id) onSelectVenue(id);
  };

  const ctrl =
    "flex h-[29px] items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:text-gray-300";

  return (
    <div className="relative h-full w-full">
      <Map
        ref={attachMap}
        initialViewState={{ longitude: TORONTO.lng, latitude: TORONTO.lat, zoom: 13 }}
        mapStyle={styleUrl}
        interactiveLayerIds={INTERACTIVE_LAYERS}
        cursor={cursor}
        onMouseEnter={() => setCursor("pointer")}
        onMouseLeave={() => setCursor("")}
        onClick={handleClick}
        onLoad={(e) => {
          const c = e.target.getCenter();
          onCenterChange({ lat: c.lat, lng: c.lng });
          onReady();
        }}
        onMoveEnd={(e) => {
          const c = e.target.getCenter();
          onCenterChange({ lat: c.lat, lng: c.lng });
        }}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <Source id={VENUE_SOURCE} type="geojson" data={venueData} cluster clusterMaxZoom={12} clusterRadius={45}>
          <Layer {...clusters} />
          <Layer {...clusterCounts} />
          <Layer {...pinLayer} />
        </Source>
        <Source id={SELECTED_SOURCE} type="geojson" data={selectedData}>
          <Layer {...selectedLayer} />
        </Source>
        <UserPositionMarker position={userPosition} />
        <NavigationControl position="bottom-right" showCompass={false} />
        <AttributionControl position="bottom-right" compact customAttribution="Restaurant locations © OpenStreetMap contributors (ODbL)" />
      </Map>

      <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
        <button type="button" onClick={() => setSatellite((v) => !v)} className={ctrl} aria-pressed={satellite}>
          <Icon name="layers" className="h-3.5 w-3.5" />
          {satellite ? "Map" : "Satellite"}
        </button>
        <button
          type="button"
          onClick={onLocateMe}
          disabled={!userPosition}
          title={userPosition ? "Go to your location" : "Location unavailable"}
          className={ctrl}
        >
          <Icon name="myLocation" className="h-3.5 w-3.5" />
          My location
        </button>
      </div>
    </div>
  );
}
