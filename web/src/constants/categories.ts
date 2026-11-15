import type { VenueCategory } from "../types/venues";

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

export const PIN_PATH =
  "M16 0C7.163 0 0 7.163 0 16c0 10.5 16 26 16 26s16-15.5 16-26c0-8.837-7.163-16-16-16z";

export const isVenueCategory = (c: string): c is VenueCategory =>
  c in CATEGORY_COLORS;
