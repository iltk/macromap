import { isVenueCategory } from "../constants/categories";
import type {
  LocationDetails,
  RestaurantMenu,
  RestaurantSummary,
  SearchResponse,
  SuggestionResponse,
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

export interface SuggestionParams {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  avoid?: string[];
  lat?: number;
  lng?: number;
  restaurant?: string;
  limit?: number;
  /** breakfast | lunch | dinner | snack: suggestions fit the meal */
  meal?: string;
  /** "protein": cheapest way to close the protein gap */
  mode?: "protein";
}

/** Turns params into a stable query string (also used as a cache key). */
export function suggestionQuery(p: SuggestionParams): string {
  const q = new URLSearchParams();
  q.set("calories", String(Math.round(p.calories)));
  if (p.protein != null) q.set("protein", String(Math.round(p.protein)));
  if (p.carbs != null) q.set("carbs", String(Math.round(p.carbs)));
  if (p.fat != null) q.set("fat", String(Math.round(p.fat)));
  if (p.avoid?.length) q.set("avoid", [...p.avoid].sort().join(","));
  if (p.lat != null && p.lng != null) {
    q.set("lat", p.lat.toFixed(3)); // ~100 m: enough precision, and fewer refetches while walking
    q.set("lng", p.lng.toFixed(3));
  }
  if (p.restaurant) q.set("restaurant", p.restaurant);
  if (p.limit) q.set("limit", String(p.limit));
  if (p.meal) q.set("meal", p.meal);
  if (p.mode) q.set("mode", p.mode);
  return q.toString();
}

export function fetchSuggestions(query: string, signal?: AbortSignal): Promise<SuggestionResponse> {
  return getJson<SuggestionResponse>(`/api/suggestions?${query}`, signal);
}
