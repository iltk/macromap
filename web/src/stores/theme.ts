import { useEffect, useSyncExternalStore } from "react";
import { createPersistentStore } from "../utils/storage";

export type ThemePref = "system" | "light" | "dark";
export const THEME_KEY = "macromap.theme.v1";

const pref = createPersistentStore<ThemePref>(THEME_KEY, "system");
const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

const subscribeSystem = (cb: () => void) => {
  media?.addEventListener("change", cb);
  return () => media?.removeEventListener("change", cb);
};

export const useThemePref = () => useSyncExternalStore(pref.subscribe, pref.get, pref.get);
export const setThemePref = (p: ThemePref) => pref.set(p);

/** The theme actually in effect ("system" resolved against the OS setting). */
export function useResolvedTheme(): "light" | "dark" {
  const p = useThemePref();
  const systemDark = useSyncExternalStore(subscribeSystem, () => Boolean(media?.matches), () => false);
  return p === "system" ? (systemDark ? "dark" : "light") : p;
}

/** Keeps the `dark` class on <html> in sync. Mount once. */
export function ThemeController() {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}
