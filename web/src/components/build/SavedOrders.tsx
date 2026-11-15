import { useNavigate } from "react-router";
import { deleteSavedOrder, loadOrderIntoPlan, logSavedOrder, slotForTime, SLOT_LABELS, totalsOf, useTracker, type SavedOrder } from "../../stores/tracker";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";
import { undoable } from "../ui/undoable";

/** Saved orders: log one in a tap, or open it in the builder to tweak. */
export function SavedOrders({ compact = false, emptyText }: { compact?: boolean; emptyText?: string }) {
  const { savedOrders } = useTracker();
  const navigate = useNavigate();

  if (savedOrders.length === 0) return emptyText ? <p className="px-4 py-4 text-sm text-gray-500">{emptyText}</p> : null;

  const log = (o: SavedOrder) => {
    const slot = slotForTime();
    undoable(`Logged “${o.name}” to ${SLOT_LABELS[slot].toLowerCase()}`, () => logSavedOrder(o, { slot }));
  };
  const edit = (o: SavedOrder) => {
    loadOrderIntoPlan(o);
    navigate(`/build?r=${o.items[0]?.item.restaurantSlug ?? ""}`);
  };

  return (
    <ul className={compact ? "max-h-80 divide-y divide-gray-100 overflow-y-auto" : "grid gap-3 sm:grid-cols-2"}>
      {savedOrders.map((o) => {
        const t = totalsOf(o.items);
        return (
          <li key={o.id} className={compact ? "px-4 py-3" : "rounded-xl border border-gray-200 bg-white p-4"}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{o.name}</p>
                <p className="truncate text-xs text-gray-500">{o.items.map((p) => `${p.qty > 1 ? `${p.qty}× ` : ""}${p.item.name}`).join(", ")}</p>
                <p className="mt-0.5 text-xs text-gray-700 tabular-nums">
                  {Math.round(t.calories)} cal · <span className="text-accent-ink">{Math.round(t.protein)} g protein</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => undoable(`Deleted “${o.name}”`, () => deleteSavedOrder(o.id))}
                aria-label={`Delete saved order ${o.name}`}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => log(o)} className={`${ui.btnSmall} h-7`}>
                Log it
              </button>
              <button type="button" onClick={() => edit(o)} className={`${ui.btnSmall} h-7`}>
                Edit in builder
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
