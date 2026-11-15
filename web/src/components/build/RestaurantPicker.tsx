

import { RestaurantLogo } from "../restaurants/RestaurantLogo";
import { Icon } from "../ui/icons";
import type { RestaurantSummary } from "../../types/venues";

export function RestaurantPicker({
  restaurants,
  loading,
  onChoose,
}: {
  restaurants: RestaurantSummary[] | null;
  loading: boolean;
  onChoose: (slug: string) => void;
}) {
  const sorted = [...(restaurants ?? [])].sort((a, b) => Number(b.menuItemCount > 0) - Number(a.menuItemCount > 0) || a.name.localeCompare(b.name));
  return (
    <section className="mt-8">
      <ol className="mb-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
        <li>
          <span className="font-semibold text-gray-900">1.</span> Pick a place
        </li>
        <li>
          <span className="font-semibold text-gray-900">2.</span> Add what you'd order
        </li>
        <li>
          <span className="font-semibold text-gray-900">3.</span> Check the totals, log it if you eat it
        </li>
      </ol>
      {loading && !restaurants ? (
        <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white" />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((r) => {
            const ready = r.menuItemCount > 0;
            return (
              <li key={r.slug}>
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => onChoose(r.slug)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-gray-200"
                >
                  <RestaurantLogo name={r.name} brandColor={r.brandColor} category={r.category} logoUrl={r.logoUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900">{r.name}</span>
                    <span className="block text-xs text-gray-500">{ready ? `${r.menuItemCount} items` : "Menu coming soon"}</span>
                  </span>
                  {ready && <Icon name="chevronRight" className="h-5 w-5 text-gray-400" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
