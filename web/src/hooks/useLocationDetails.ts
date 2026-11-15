import { useEffect, useState } from "react";
import { fetchLocationDetails } from "../api/venues";
import type { LocationDetails } from "../types/venues";

interface Result {
  id: string;
  data: LocationDetails | null;
  error: string | null;
}

export function useLocationDetails(locationId: string | null) {
  const [result, setResult] = useState<Result | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!locationId) return;
    const controller = new AbortController();
    fetchLocationDetails(locationId, controller.signal)
      .then((data) => setResult({ id: locationId, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          id: locationId,
          data: null,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [locationId, retryToken]);

  const current = result && result.id === locationId ? result : null;
  return {
    details: current?.data ?? null,
    error: current?.error ?? null,
    isLoading: Boolean(locationId) && !current,
    retry: () => {
      setResult(null);
      setRetryToken((t) => t + 1);
    },
  };
}
