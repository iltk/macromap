import { useEffect, useState } from "react";
import { fetchVenues } from "../api/venues";
import type { Venue } from "../types/venues";

/** Loads every map pin once on startup. */
export function useVenueData() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchVenues(controller.signal)
      .then((data) => {
        setVenues(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { venues, isLoading, error };
}
