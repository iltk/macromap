import { Link } from "react-router";
import type { MenuItem, SuggestionLocation, SuggestionRestaurant } from "../../types/venues";
import { formatDistance } from "../../utils/geo";
import { getOpenStatus } from "../../utils/openingHours";
import { FoodImage } from "../media/FoodImage";
import { ui } from "../ui/styles";

export interface SuggestionRowData {
  key: string;
  items: MenuItem[];
  restaurant: SuggestionRestaurant;
  calories: number;
  protein: number;
  location: SuggestionLocation | null;
}

export function SuggestionRow({ row, now, reason, onLog }: { row: SuggestionRowData; now: Date; reason: string; onLog: () => void }) {
  const status = row.location ? getOpenStatus(row.location.openingHours, now) : null;
  const href = row.location ? `/?place=${row.location.locationId}` : `/restaurants/${row.restaurant.slug}?item=${row.items[0].id}`;
  return (
    <li className="flex gap-3 px-4 py-3">
      <div className="flex shrink-0 -space-x-3">
        {row.items.map((m) => (
          <FoodImage key={m.id} section={m.menuCategory} src={m.imageUrl} alt={m.name} tintKey={m.menuCategory ?? ""} variant="thumb" className="h-12 w-12 rounded-md border-2 border-white" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{row.items.map((m) => m.name).join(" + ")}</p>
        <p className="text-xs text-gray-500">
          {row.restaurant.name}
          {row.location && ` · ${formatDistance(row.location.distanceMeters)}`}
          {status && (
            <>
              {" · "}
              <span className={status.open ? "text-success-ink" : "text-danger-ink"}>{status.label}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-700 tabular-nums">
          <span className="font-medium">{Math.round(row.calories)} cal</span> · <span className="text-accent-ink">{Math.round(row.protein)} g protein</span>
          <span className="text-gray-500"> · {reason}</span>
        </p>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={onLog} className={ui.btnAccentSmall}>
            Log it
          </button>
          <Link to={href} className={`text-xs ${ui.link}`}>
            {row.location ? "Show on map" : "View menu"}
          </Link>
        </div>
      </div>
    </li>
  );
}
