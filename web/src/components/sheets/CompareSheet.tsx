

import { clearCompare, compareSnapshot, restoreCompare, toggleCompare, useCompare, type ItemRef } from "../../stores/compare";
import { undoableWith } from "../ui/undoable";
import { proteinDensity } from "../../utils/macros";
import { ui } from "../ui/styles";
import { EmptyState } from "../ui/EmptyState";

const round1 = (n: number) => Math.round(n * 10) / 10;

const ROWS: { label: string; get: (i: ItemRef) => number | null; unit: string; better: "low" | "high" | null }[] = [
  { label: "Calories", get: (i) => i.calories, unit: "cal", better: "low" },
  { label: "Protein", get: (i) => i.protein, unit: "g", better: "high" },
  { label: "Carbs", get: (i) => i.carbs, unit: "g", better: null },
  { label: "Fat", get: (i) => i.fat, unit: "g", better: null },
  { label: "Protein per 100 cal", get: (i) => proteinDensity(i), unit: "g", better: "high" },
];

export function CompareSheet() {
  const { compare } = useCompare();
  const [a, b] = compare;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {compare.length === 0 && (
        <EmptyState size="sm" art="burger" title="Nothing to compare yet" text="Tap “Compare” on two menu items to see them side by side." />
      )}
      {compare.length === 1 && (
        <p className="mb-4 text-sm text-gray-600">
          Choose one more item with <span className="font-semibold">Compare</span> on any menu.
        </p>
      )}
      {compare.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 align-bottom">
              <th className="w-28" />
              {[a, b].map((it, i) => (
                <th key={i} className="px-2 pb-2 text-left font-normal">
                  {it ? (
                    <>
                      <span className="block leading-snug font-semibold text-gray-900">{it.name}</span>
                      <span className="block text-xs text-gray-500">{it.restaurantName}</span>
                      <button type="button" onClick={() => toggleCompare(it)} className={`mt-1 text-xs ${ui.link}`}>
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const va = a ? row.get(a) : null;
              const vb = b ? row.get(b) : null;
              const winner =
                row.better && va != null && vb != null && va !== vb
                  ? (row.better === "low" ? va < vb : va > vb) ? 0 : 1
                  : null;
              return (
                <tr key={row.label} className="border-b border-gray-200">
                  <th scope="row" className="py-2.5 text-left font-normal text-gray-600">{row.label}</th>
                  {[va, vb].map((v, i) => (
                    <td key={i} className={`px-2 py-2.5 tabular-nums ${winner === i ? "font-semibold text-accent-ink" : "text-gray-900"}`}>
                      {v == null ? "–" : `${round1(v)} ${row.unit}`}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {a && b && <p className="mt-3 text-xs text-gray-500">Highlighted: fewer calories, more protein.</p>}
      {compare.length > 0 && (
        <button
          type="button"
          onClick={() => {
            const before = compareSnapshot();
            undoableWith("Comparison cleared", clearCompare, () => restoreCompare(before));
          }}
          className={`mt-4 text-sm ${ui.link}`}
        >
          Clear comparison
        </button>
      )}
    </div>
  );
}
