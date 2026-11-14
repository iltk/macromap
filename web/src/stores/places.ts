import { useSyncExternalStore } from "react";
import type { LocationDetails } from "../types/venues";
import { createPersistentStore } from "../utils/storage";

/** Enough to list and fly to a place without refetching it. */
export interface PlaceRef {
  locationId: string;
  name: string;
  slug: string;
  address: string;
  latitude: number;
  longitude: number;
}

const MAX_RECENTS = 8;

const saved = createPersistentStore<PlaceRef[]>("macromap.saved.v1", []);
const recents = createPersistentStore<PlaceRef[]>("macromap.recents.v1", []);

export const toPlaceRef = (d: LocationDetails): PlaceRef => ({
  locationId: d.locationId,
  name: d.name,
  slug: d.slug,
  address: d.address,
  latitude: d.latitude,
  longitude: d.longitude,
});

export function toggleSaved(place: PlaceRef) {
  saved.set((list) =>
    list.some((p) => p.locationId === place.locationId)
      ? list.filter((p) => p.locationId !== place.locationId)
      : [place, ...list],
  );
}

export function addRecent(place: PlaceRef) {
  recents.set((list) =>
    [place, ...list.filter((p) => p.locationId !== place.locationId)].slice(0, MAX_RECENTS),
  );
}

export const clearRecents = () => recents.set([]);

export const useSavedPlaces = () => useSyncExternalStore(saved.subscribe, saved.get, saved.get);
export const useRecentPlaces = () => useSyncExternalStore(recents.subscribe, recents.get, recents.get);
