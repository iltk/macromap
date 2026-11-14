import type { Venue, VenueFilter } from "../../types/venues";

interface FilterChipsProps {
  venues: Venue[];
  filter: VenueFilter;
  onChange: (filter: VenueFilter) => void;
}

const sameFilter = (a: VenueFilter, b: VenueFilter) =>
  a.kind === b.kind &&
  (a.kind !== "category" || a.category === (b as typeof a).category) &&
  (a.kind !== "chain" || a.slug === (b as typeof a).slug);

export function FilterChips({ venues, filter, onChange }: FilterChipsProps) {
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
      {chips.map((chip) => {
        const active = sameFilter(chip.value, filter);
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onChange(active ? { kind: "all" } : chip.value)}
            aria-pressed={active}
            className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-colors ${
              active ? "bg-[#e8f0fe] text-[#1967d2]" : "bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
