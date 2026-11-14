import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { SELECTED_COLOR } from "../../constants/categories";
import { LABEL_FONT } from "./mapStyles";

export const VENUE_SOURCE = "venues";
export const SELECTED_SOURCE = "selected-venue";

export const clusterLayer: CircleLayerSpecification = {
  id: "clusters",
  type: "circle",
  source: VENUE_SOURCE,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#f28b82",
      20,
      "#ea4335",
      60,
      "#c5221f",
    ],
    "circle-radius": ["step", ["get", "point_count"], 15, 20, 19, 60, 24],
    "circle-stroke-width": 3,
    "circle-stroke-color": "rgba(255,255,255,0.9)",
  },
};

export const clusterCountLayer: SymbolLayerSpecification = {
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
  paint: { "text-color": "#ffffff" },
};

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

export function venuePinLayer(selectedId: string | null): SymbolLayerSpecification {
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
      "text-color": "#3c4043",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
    },
  };
}

export const selectedPinLayer: SymbolLayerSpecification = {
  id: "selected-pin",
  type: "symbol",
  source: SELECTED_SOURCE,
  layout: pinLayout(true),
  paint: {
    "text-color": SELECTED_COLOR,
    "text-halo-color": "#ffffff",
    "text-halo-width": 2,
  },
};

export const INTERACTIVE_LAYERS = ["clusters", "venue-pins", "selected-pin"];
