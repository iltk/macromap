import { useSyncExternalStore } from "react";

// Which side sheet is open. Kept in memory only, so a reload never reopens one.
type Sheet = "prefs" | "targets" | "compare" | null;

let sheet: Sheet = null;
const listeners = new Set<() => void>();

export function openSheet(next: Sheet) {
  sheet = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSheet = () => useSyncExternalStore(subscribe, () => sheet, () => sheet);
