import { isVenueCategory } from "../constants/categories";
import type {
  LocationDetails,
  RestaurantMenu,
  RestaurantSummary,
  SearchResponse,
  Venue,
  VenueCategory,
} from "../types/venues";

/** The DB may hold free-form categories (e.g. "Japanese"); the map only styles a few. */
const normalizeCategory = (c: string): VenueCategory => (isVenueCategory(c) ? c : "restaurant");

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(
      response.status === 404 ? "Not found" : `Request failed (${response.status})`,
    );
  }
  return (await response.json()) as T;
}

export function fetchVenues(signal?: AbortSignal): Promise<Venue[]> {
  return getJson<Venue[]>("/api/restaurants/pins", signal).then((venues) =>
    venues.map((v) => ({ ...v, category: normalizeCategory(v.category) })),
  );
}

export function fetchLocationDetails(
  locationId: string,
  signal?: AbortSignal,
): Promise<LocationDetails> {
  return getJson<LocationDetails>(
    `/api/locations/${encodeURIComponent(locationId)}`,
    signal,
  ).then((d) => ({ ...d, category: normalizeCategory(d.category) }));
}

export function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  return getJson<SearchResponse>(
    `/api/search?q=${encodeURIComponent(query)}`,
    signal,
  ).then((r) => ({
    ...r,
    restaurants: r.restaurants.map((h) => ({ ...h, category: normalizeCategory(h.category) })),
  }));
}

export function fetchRestaurants(
  goalQuery: string,
  signal?: AbortSignal,
): Promise<RestaurantSummary[]> {
  const qs = goalQuery ? `?${goalQuery}` : "";
  return getJson<RestaurantSummary[]>(`/api/restaurants${qs}`, signal).then((rs) =>
    rs.map((r) => ({ ...r, category: normalizeCategory(r.category) })),
  );
}

export function fetchRestaurantMenu(slug: string, signal?: AbortSignal): Promise<RestaurantMenu> {
  return getJson<RestaurantMenu>(`/api/restaurants/${encodeURIComponent(slug)}`, signal).then(
    (r) => ({ ...r, category: normalizeCategory(r.category) }),
  );
}
