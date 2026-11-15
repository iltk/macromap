import { useEffect, useState } from "react";

interface Result<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Runs `fetcher` whenever `key` changes (null skips the request). A response only
 * shows while its key is current, so a slow old request can't overwrite a newer one.
 */
export function useApi<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  { keepPrevious = false }: { keepPrevious?: boolean } = {},
) {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    fetcher(controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key, data: null, error: err instanceof Error ? err.message : "Unknown error" });
      });
    return () => controller.abort();
    // fetcher is intentionally keyed by `key`, not by identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const current = result && result.key === key ? result : null;
  return {
    data: current?.data ?? (keepPrevious ? (result?.data ?? null) : null),
    error: current?.error ?? null,
    isLoading: key !== null && !current,
    retry: () => {
      setResult(null);
      setAttempt((a) => a + 1);
    },
  };
}
