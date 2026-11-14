const KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;

export type MapStyleId = "streets" | "satellite";

export const MAP_STYLES: Record<MapStyleId, { label: string; url: string }> = {
  streets: {
    label: "Map",
    url: `https://api.maptiler.com/maps/streets-v2/style.json?key=${KEY}`,
  },
  satellite: {
    label: "Satellite",
    url: `https://api.maptiler.com/maps/hybrid-v4/style.json?key=${KEY}`,
  },
};

export const HAS_MAP_KEY = Boolean(KEY);

export const LABEL_FONT = ["Roboto Medium", "Noto Sans Regular"];
