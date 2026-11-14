import type { VenueCategory } from "../types/venues";

export const CATEGORY_ICON_PATHS: Record<VenueCategory, string> = {
  restaurant:
    "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  cafe: "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z",
  bar: "M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z",
};

export const CATEGORY_COLORS: Record<VenueCategory, string> = {
  restaurant: "#ea4335",
  cafe: "#935638",
  bar: "#673ab7",
};

export const CATEGORY_LABELS: Record<VenueCategory, string> = {
  restaurant: "Fast food restaurant",
  cafe: "Coffee shop",
  bar: "Bar",
};

export const SELECTED_COLOR = "#1a73e8";

export const PIN_PATH =
  "M16 0C7.163 0 0 7.163 0 16c0 10.5 16 26 16 26s16-15.5 16-26c0-8.837-7.163-16-16-16z";

export const isVenueCategory = (c: string): c is VenueCategory =>
  c in CATEGORY_COLORS;
