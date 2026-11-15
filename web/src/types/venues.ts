export type VenueCategory = "restaurant" | "cafe" | "bar";

/** One map pin (a single restaurant location), from GET /api/restaurants/pins. */
export interface Venue {
  locationId: string;
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  brandColor: string | null;
  latitude: number;
  longitude: number;
  /** Raw OpenStreetMap opening_hours; null when unknown. */
  openingHours: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  /** Short description for menu cards; null when not entered. */
  description: string | null;
  menuCategory: string | null;
  servingSize: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: string | null;
  /** Photo URL or app path; null = show a placeholder. */
  imageUrl: string | null;
  /** Allergen codes; null = unknown (no data), [] = verified none. */
  allergens: string[] | null;
}

/** GET /api/locations/{id} */
export interface LocationDetails {
  locationId: string;
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  brandColor: string | null;
  logoUrl: string | null;
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
  imageUrl: string | null;
}

export interface SearchResponse {
  restaurants: RestaurantHit[];
  items: MenuItemHit[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

/** One entry of GET /api/restaurants */
export interface RestaurantSummary {
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  description: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  locationCount: number;
  menuItemCount: number;
  lightestCalories: number | null;
  topProtein: number | null;
  /** Items that fit the requested goal (or all items with full macros when no goal). */
  matchingItems: number;
}

/** GET /api/restaurants/{slug} */
export interface RestaurantMenu {
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  description: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  website: string | null;
  locationCount: number;
  menu: MenuItem[];
}

/** GET /api/suggestions */
export interface SuggestionRestaurant {
  restaurantId: number;
  slug: string;
  name: string;
  category: VenueCategory;
  brandColor: string | null;
  logoUrl: string | null;
}

export interface SuggestionLocation {
  locationId: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  openingHours: string | null;
}

interface ItemSuggestion {
  item: MenuItem;
  restaurant: SuggestionRestaurant;
  score: number;
  locations: SuggestionLocation[];
}

interface ComboSuggestion {
  items: MenuItem[];
  restaurant: SuggestionRestaurant;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  score: number;
  locations: SuggestionLocation[];
}

export interface SuggestionResponse {
  items: ItemSuggestion[];
  combos: ComboSuggestion[];
}
