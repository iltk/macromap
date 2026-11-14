import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { LABEL_FONT } from "./mapStyles";

export const VENUE_SOURCE = "venues";
export const SELECTED_SOURCE = "selected-venue";

export const clusterLayer = (dark = false): CircleLayerSpecification => ({
  id: "clusters",
  type: "circle",
  source: VENUE_SOURCE,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": dark ? "#e2dfd8" : "#2f2d29",
    "circle-opacity": 0.92,
    "circle-radius": ["step", ["get", "point_count"], 14, 20, 18, 60, 22],
    "circle-stroke-width": 2,
    "circle-stroke-color": dark ? "#1c1b19" : "#ffffff",
  },
});

export const clusterCountLayer = (dark = false): SymbolLayerSpecification => ({
  id: "cluster-count",
  type: "symbol",
  source: VENUE_SOURCE,
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": LABEL_FONT,
    "text-size": 12,
    "text-allow-overlap": true,
  },
  paint: { "text-color": dark ? "#1c1b19" : "#ffffff" },
});

const pinLayout = (selected: boolean): SymbolLayerSpecification["layout"] => ({
  "icon-image": selected
    ? ["concat", "pin-", ["get", "slug"], "-selected"]
    : ["concat", "pin-", ["get", "slug"]],
  "icon-anchor": "bottom",
  "icon-size": selected ? 1.3 : 1,
  "icon-allow-overlap": true,
  "icon-ignore-placement": selected,
  // Labels only once zoomed in far enough to read the street grid (always for the selected pin).
  "text-field": selected
    ? ["get", "label"]
    : ["step", ["zoom"], "", 14, ["get", "label"]],
  "text-font": LABEL_FONT,
  "text-size": selected ? 14 : 12,
  "text-anchor": "left",
  "text-offset": selected ? [1.3, -1.9] : [1.1, -1.4],
  "text-optional": true,
  "text-allow-overlap": selected,
});

export function venuePinLayer(selectedId: string | null, dark = false): SymbolLayerSpecification {
  return {
    id: "venue-pins",
    type: "symbol",
    source: VENUE_SOURCE,
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      ["!=", ["get", "locationId"], selectedId ?? ""],
    ],
    layout: pinLayout(false),
    paint: {
      // pins whose menu has nothing for the active goal fade into the background
      "icon-opacity": ["case", ["get", "dim"], 0.3, 1],
      "text-opacity": ["case", ["get", "dim"], 0.45, 1],
      "text-color": dark ? "#e2dfd8" : "#2f2d29",
      "text-halo-color": dark ? "#1c1b19" : "#ffffff",
      "text-halo-width": 1.5,
    },
  };
}

export const selectedPinLayer = (dark = false): SymbolLayerSpecification => ({
  id: "selected-pin",
  type: "symbol",
  source: SELECTED_SOURCE,
  layout: pinLayout(true),
  paint: {
    "text-color": dark ? "#f2f0eb" : "#1d1c19",
    "text-halo-color": dark ? "#1c1b19" : "#ffffff",
    "text-halo-width": 2,
  },
});

export const INTERACTIVE_LAYERS = ["clusters", "venue-pins", "selected-pin"];
