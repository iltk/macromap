import type { Venue, VenueCategory } from "../../types/venues";
import type { MapFilterState } from "../../utils/filter";
import { ui } from "../ui/styles";

/** "Open now" plus one "Show" menu (all / by type / one chain): fits on one row. */
export function MapFilters({
  venues,
  value,
  onChange,
}: {
  venues: Venue[];
  value: MapFilterState;
  onChange: (f: MapFilterState) => void;
}) {
  const chains = [...new Map(venues.map((v) => [v.slug, v.name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const current = value.chain ? `chain:${value.chain}` : value.category ? `type:${value.category}` : "all";

  const choose = (v: string) => {
    if (v.startsWith("chain:")) onChange({ ...value, chain: v.slice(6), category: null });
    else if (v.startsWith("type:")) onChange({ ...value, category: v.slice(5) as VenueCategory, chain: null });
    else onChange({ ...value, category: null, chain: null });
  };

  return (
    <div className="flex items-center gap-2">
      <label className={`${ui.btnSmall} shrink-0 cursor-pointer ${value.openNow ? "border-accent bg-accent-soft text-accent-ink" : ""}`}>
        <input
          type="checkbox"
          checked={value.openNow}
          onChange={(e) => onChange({ ...value, openNow: e.target.checked })}
          className="accent-(--color-accent)"
        />
        Open now
      </label>
      <select value={current} onChange={(e) => choose(e.target.value)} aria-label="Show" className={`${ui.select} h-8 min-w-0 flex-1`}>
        <option value="all">All places</option>
        <optgroup label="Type">
          <option value="type:restaurant">Restaurants</option>
          <option value="type:cafe">Cafés</option>
        </optgroup>
        <optgroup label="Chain">
          {chains.map(([slug, name]) => (
            <option key={slug} value={`chain:${slug}`}>
              {name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
