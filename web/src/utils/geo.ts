import type { Coordinates } from "../types/venues";

export const TORONTO: Coordinates = { lat: 43.6532, lng: -79.3832 };

/** Great-circle distance in metres. */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  if (meters < 10_000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000)} km`;
}

export function nearest<T extends { latitude: number; longitude: number }>(
  items: T[],
  from: Coordinates,
): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const it of items) {
    const d = distanceMeters(from, { lat: it.latitude, lng: it.longitude });
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best;
}
