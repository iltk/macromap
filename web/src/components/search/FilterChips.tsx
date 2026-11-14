import type { Venue, VenueFilter } from "../../types/venues";
import { Icon } from "../ui/icons";

interface FilterChipsProps {
  venues: Venue[];
  filter: VenueFilter;
  onChange: (filter: VenueFilter) => void;
  openNow: boolean;
  onOpenNowChange: (open: boolean) => void;
  /** Extra chips rendered after the toggles (e.g. the goal picker). */
  children?: React.ReactNode;
}

const sameFilter = (a: VenueFilter, b: VenueFilter) =>
  a.kind === b.kind &&
  (a.kind !== "category" || a.category === (b as typeof a).category) &&
  (a.kind !== "chain" || a.slug === (b as typeof a).slug);

export function FilterChips({ venues, filter, onChange, openNow, onOpenNowChange, children }: FilterChipsProps) {
  const chains = new Map<string, string>();
  for (const v of venues) chains.set(v.slug, v.name);

  const chips: { label: string; value: VenueFilter }[] = [
    { label: "All", value: { kind: "all" } },
    { label: "Restaurants", value: { kind: "category", category: "restaurant" } },
    { label: "Coffee", value: { kind: "category", category: "cafe" } },
    ...[...chains.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([slug, name]) => ({ label: name, value: { kind: "chain", slug } as VenueFilter })),
  ];

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onOpenNowChange(!openNow)}
        aria-pressed={openNow}
        className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-colors ${
          openNow ? "bg-success-soft text-success-ink" : "bg-white text-gray-800 hover:bg-gray-50"
        }`}
      >
        <Icon name="clock" className="h-4 w-4" />
        Open now
      </button>
      {children}
      <span className="my-1 w-px shrink-0 bg-gray-300/80" aria-hidden />
      {chips.map((chip) => {
        const active = sameFilter(chip.value, filter);
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onChange(active ? { kind: "all" } : chip.value)}
            aria-pressed={active}
            className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-colors ${
              active ? "bg-accent-soft text-accent-ink" : "bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
