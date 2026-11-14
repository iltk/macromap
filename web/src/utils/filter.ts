import type { Venue, VenueFilter } from "../types/venues";

export function applyFilter(venues: Venue[], filter: VenueFilter): Venue[] {
  switch (filter.kind) {
    case "all":
      return venues;
    case "category":
      return venues.filter((v) => v.category === filter.category);
    case "chain":
      return venues.filter((v) => v.slug === filter.slug);
  }
}
