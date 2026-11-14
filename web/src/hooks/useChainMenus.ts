import { useMemo } from "react";
import { fetchRestaurantMenu } from "../api/venues";
import type { RestaurantMenu } from "../types/venues";
import { useApi } from "./useApi";

// Menus rarely change during a session: share one request per chain across the app.
const cache = new Map<string, Promise<RestaurantMenu>>();

export function loadMenu(slug: string): Promise<RestaurantMenu> {
  let p = cache.get(slug);
  if (!p) {
    p = fetchRestaurantMenu(slug).catch((err) => {
      cache.delete(slug);
      throw err;
    });
    cache.set(slug, p);
  }
  return p;
}

/** Full menus for the given chains, as slug -> menu (partial while loading). */
export function useChainMenus(slugs: string[]) {
  const key = [...new Set(slugs)].sort().join(",");
  const { data, isLoading, error } = useApi(
    key ? `menus:${key}` : null,
    () => Promise.all(key.split(",").map(loadMenu)),
    { keepPrevious: true },
  );
  const menus = useMemo(() => new Map((data ?? []).map((m) => [m.slug, m] as const)), [data]);
  return { menus, isLoading, error };
}
