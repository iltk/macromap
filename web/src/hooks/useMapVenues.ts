import { useCallback, useMemo } from "react";
import type { Venue } from "../types/venues";
import { applyMapFilters, type MapFilterState } from "../utils/filter";
import { getOpenStatus } from "../utils/openingHours";

/** Pins after the map filters, and how many "open now" hid because their hours are unknown. */
export function useMapVenues(venues: Venue[], filters: MapFilterState, now: Date) {
  const isOpen = useCallback((v: Venue) => getOpenStatus(v.openingHours, now)?.open === true, [now]);
  const visible = useMemo(() => applyMapFilters(venues, filters, isOpen), [venues, filters, isOpen]);
  const hiddenUnknownHours = useMemo(() => {
    if (!filters.openNow) return 0;
    return applyMapFilters(venues, { ...filters, openNow: false }, () => true).filter((v) => !getOpenStatus(v.openingHours, now)).length;
  }, [venues, filters, now]);
  return { visible, hiddenUnknownHours };
}
