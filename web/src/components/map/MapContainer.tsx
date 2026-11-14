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
import type { Coordinates, Venue } from "../../types/venues";
import { TORONTO } from "../../utils/geo";
import { UserPositionMarker } from "../markers/UserPositionMarker";
import { Icon } from "../ui/icons";
import { MAP_STYLES, type MapStyleId } from "./mapStyles";
import { registerPinImages, type PinBrand } from "./pinImages";
import { brandColorFor, initialsFor } from "../../utils/brand";
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
  panelOpen: boolean;
  /** slug -> number of menu items that fit the active goal; null when no goal is set. */
  fitsBySlug: Map<string, number> | null;
  onSelectVenue: (locationId: string | null) => void;
  onLocateMe: () => void;
  onReady: () => void;
}

type VenueProps = Pick<Venue, "locationId" | "name" | "category" | "slug"> & {
  label: string;
  dim: boolean;
};

function toFeatureCollection(
  venues: Venue[],
  fitsBySlug: Map<string, number> | null,
): FeatureCollection<Point, VenueProps> {
  return {
    type: "FeatureCollection",
    features: venues.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
      properties: {
        locationId: v.locationId,
        name: v.name,
        category: v.category,
        slug: v.slug,
        ...pinLabel(v, fitsBySlug),
      },
    })),
  };
}

function pinLabel(v: Venue, fitsBySlug: Map<string, number> | null) {
  if (!fitsBySlug) return { label: v.name, dim: false };
  const fits = fitsBySlug.get(v.slug) ?? 0;
  return { label: fits > 0 ? `${v.name} · ${fits} fit` : v.name, dim: fits === 0 };
}

export function MapContainer({
  mapRef,
  userPosition,
  venues,
  selectedVenue,
  panelOpen,
  fitsBySlug,
  onSelectVenue,
  onLocateMe,
  onReady,
}: MapContainerProps) {
  const [styleId, setStyleId] = useState<MapStyleId>("streets");
  const [cursor, setCursor] = useState<string>("");

  const venueData = useMemo(() => toFeatureCollection(venues, fitsBySlug), [venues, fitsBySlug]);
  const selectedId = selectedVenue?.locationId ?? null;
  const selectedData = useMemo(
    () => toFeatureCollection(selectedVenue ? [selectedVenue] : [], fitsBySlug),
    [selectedVenue, fitsBySlug],
  );
  // slug -> brand, read lazily by the pin image handler (venues load after the map mounts)
  const brands = useRef(new globalThis.Map<string, PinBrand>());
  useEffect(() => {
    for (const v of venues) {
      if (!brands.current.has(v.slug)) {
        brands.current.set(v.slug, {
          color: brandColorFor(v.brandColor, v.category),
          initials: initialsFor(v.name),
        });
      }
    }
  }, [venues]);

  // Callback ref: hook up pin images the moment the map exists, before any layer asks for them.
  const attachMap = useCallback(
    (instance: MapRef | null) => {
      mapRef.current = instance;
      if (instance) registerPinImages(instance.getMap(), (slug) => brands.current.get(slug));
    },
    [mapRef],
  );

  const pinLayer = useMemo(() => venuePinLayer(selectedId), [selectedId]);

  const handleClick = async (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      onSelectVenue(null);
      return;
    }
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

  const nextStyle: MapStyleId = styleId === "streets" ? "satellite" : "streets";

  return (
    <div className="relative h-full w-full">
      <Map
        ref={attachMap}
        initialViewState={{ longitude: TORONTO.lng, latitude: TORONTO.lat, zoom: 12 }}
        mapStyle={MAP_STYLES[styleId].url}
        interactiveLayerIds={INTERACTIVE_LAYERS}
        cursor={cursor}
        onMouseEnter={() => setCursor("pointer")}
        onMouseLeave={() => setCursor("")}
        onClick={handleClick}
        onLoad={onReady}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <Source
          id={VENUE_SOURCE}
          type="geojson"
          data={venueData}
          cluster
          clusterMaxZoom={12}
          clusterRadius={45}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...pinLayer} />
        </Source>
        <Source id={SELECTED_SOURCE} type="geojson" data={selectedData}>
          <Layer {...selectedPinLayer} />
        </Source>

        <UserPositionMarker position={userPosition} />

        <NavigationControl position="bottom-right" showCompass={false} />
        <AttributionControl
          position="bottom-right"
          compact
          customAttribution="Restaurant locations © OpenStreetMap contributors (ODbL)"
        />
      </Map>

      {/* My location: sits above the zoom buttons, like Google Maps */}
      <button
        type="button"
        onClick={onLocateMe}
        disabled={!userPosition}
        title={userPosition ? "Show your location" : "Location unavailable"}
        className="absolute right-[10px] bottom-[118px] flex h-[29px] w-[29px] items-center justify-center rounded bg-white text-gray-700 shadow-[0_0_0_2px_rgba(0,0,0,0.1)] hover:bg-gray-50 disabled:text-gray-300"
      >
        <Icon name="myLocation" className="h-[18px] w-[18px]" />
      </button>

      {/* Map / Satellite toggle (bottom-left, like Google's layer switcher) */}
      <button
        type="button"
        onClick={() => setStyleId(nextStyle)}
        className={`absolute bottom-6 left-4 flex h-16 w-16 flex-col items-center justify-end overflow-hidden rounded-lg border-2 border-white shadow-lg transition-[left] duration-300 ${panelOpen ? "max-md:hidden md:left-[424px]" : ""}`}
        style={{
          background:
            nextStyle === "satellite"
              ? "linear-gradient(135deg,#3a5a40,#588157 45%,#a3b18a)"
              : "linear-gradient(135deg,#f1f3f4,#e8eaed 50%,#c8e6c9)",
        }}
        aria-label={`Switch to ${MAP_STYLES[nextStyle].label} view`}
      >
        <span
          className={`mb-1 flex items-center gap-0.5 text-[11px] font-medium ${
            nextStyle === "satellite" ? "text-white" : "text-gray-800"
          }`}
        >
          <Icon name="layers" className="h-3.5 w-3.5" />
          {MAP_STYLES[nextStyle].label}
        </span>
      </button>
    </div>
  );
}
