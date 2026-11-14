export type VenueCategory = "restaurant" | "cafe" | "bar";

/** One map pin (a single restaurant location). Mirrors api RestaurantPin. */
export interface Venue {
  locationId: string;
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  latitude: number;
  longitude: number;
}

export interface MenuItem {
  id: string;
  name: string;
  menuCategory: string | null;
  servingSize: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: string | null;
}

/** Mirrors api LocationDetails. */
export interface LocationDetails {
  locationId: string;
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  brandColor: string | null;
  website: string | null;
  address: string;
  city: string | null;
  phone: string | null;
  openingHours: string | null;
  latitude: number;
  longitude: number;
  menu: MenuItem[];
}

export interface RestaurantHit {
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  locationCount: number;
}

export interface MenuItemHit {
  id: string;
  restaurantId: number;
  restaurantSlug: string;
  restaurantName: string;
  name: string;
  calories: number | null;
  protein: number | null;
}

export interface SearchResponse {
  restaurants: RestaurantHit[];
  items: MenuItemHit[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Pin filter chosen with the chips under the search bar. */
export type VenueFilter =
  | { kind: "all" }
  | { kind: "category"; category: VenueCategory }
  | { kind: "chain"; slug: string };

/** Mirrors api RestaurantSummary (one directory card). */
export interface RestaurantSummary {
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  description: string | null;
  brandColor: string | null;
  locationCount: number;
  menuItemCount: number;
}

/** Mirrors api RestaurantMenu. */
export interface RestaurantMenu {
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  description: string | null;
  brandColor: string | null;
  website: string | null;
  locationCount: number;
  menu: MenuItem[];
}
