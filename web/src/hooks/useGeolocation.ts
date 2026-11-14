import { useEffect, useState } from "react";
import type { Coordinates } from "../types/venues";

/** Watches the browser position. `coords` stays null until permission is granted. */
export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(
    typeof navigator !== "undefined" && !navigator.geolocation
      ? "Geolocation is not supported by this browser."
      : null,
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coords, error };
}
