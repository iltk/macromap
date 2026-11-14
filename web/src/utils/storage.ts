/** localStorage helpers that never throw (private mode, blocked storage, SSR). */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep the in-memory value only */
  }
}

/**
 * Tiny external store persisted to localStorage, for useSyncExternalStore.
 * Also syncs between tabs via the `storage` event.
 */
export function createPersistentStore<T>(key: string, initial: T) {
  let state = readJson<T>(key, initial);
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        state = readJson<T>(key, initial);
        emit();
      }
    });
  }

  return {
    get: () => state,
    set(update: T | ((prev: T) => T)) {
      state = typeof update === "function" ? (update as (p: T) => T)(state) : update;
      writeJson(key, state);
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
