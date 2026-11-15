import { useMemo } from "react";
import { fetchRestaurants } from "../api/venues";
import { usePrefs } from "../stores/prefs";
import { limitsToQuery } from "../utils/goals";
import { useApi } from "./useApi";

/** Restaurant summaries counted against the viewer's goal, plus a slug -> items-that-fit map. */
export function useRestaurantSummaries() {
  const prefs = usePrefs();
  const goalQuery = prefs.goalActive ? limitsToQuery(prefs.limits) : "";
  const result = useApi(`restaurants?${goalQuery}`, (signal) => fetchRestaurants(goalQuery, signal), { keepPrevious: true });
  const fitsBySlug = useMemo(
    () => (prefs.goalActive && result.data ? new Map(result.data.map((r) => [r.slug, r.matchingItems] as const)) : null),
    [prefs.goalActive, result.data],
  );
  return { ...result, fitsBySlug };
}
