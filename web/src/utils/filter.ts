import type { Venue, VenueCategory } from "../types/venues";

export interface MapFilterState {
  openNow: boolean;
  category: VenueCategory | null;
  chain: string | null;
}

export function applyMapFilters(venues: Venue[], f: MapFilterState, isOpen: (v: Venue) => boolean): Venue[] {
  return venues.filter(
    (v) =>
      (!f.category || v.category === f.category) &&
      (!f.chain || v.slug === f.chain) &&
      (!f.openNow || isOpen(v)),
  );
}
