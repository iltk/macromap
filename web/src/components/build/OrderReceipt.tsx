import { useState } from "react";
import { notify } from "../../stores/notify";
import { clearPlan, logPlan, saveOrder, setPlanQty, addToPlan, slotForTime, SLOT_LABELS, SLOTS, totalsOf, useToday, useTracker, type MealSlot } from "../../stores/tracker";
import { toTrayItem } from "../../stores/tray";
import type { MenuItem } from "../../types/venues";
import { dayKey } from "../../utils/dates";
import { MACRO_COLORS } from "../../utils/macros";
import { lighterSwap } from "../../utils/swaps";
import { FoodImage } from "../media/FoodImage";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";
import { undoable } from "../ui/undoable";
import { EmptyState } from "../ui/EmptyState";

const r = Math.round;

/** The order being built, as a running receipt with live totals. */
export function OrderReceipt({ menus }: { menus: Map<string, MenuItem[]> }) {
  const { plan } = useTracker();
  const today = useToday();
  const [slot, setSlot] = useState<MealSlot>(() => slotForTime());
  const [naming, setNaming] = useState<string | null>(null);
  const t = totalsOf(plan);
  const kcalP = t.protein * 4, kcalC = t.carbs * 4, kcalF = t.fat * 9;
  const kcalSum = Math.max(1, kcalP + kcalC + kcalF);

  const copy = async () => {
    const lines = plan.map(({ item, qty }) => `${qty} × ${item.name} (${item.restaurantName}): ${r((item.calories ?? 0) * qty)} cal`);
    lines.push(`Total: ${r(t.calories)} cal · ${r(t.protein)} g protein · ${r(t.carbs)} g carbs · ${r(t.fat)} g fat`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      notify("Order copied");
    } catch {
      notify("Couldn't copy the order");
    }
  };

  if (plan.length === 0) {
    return (
      <EmptyState art="burger" size="sm" title="Your order is empty" text="Tap + on menu items. Calories and macros add up here as you go." />
    );
  }

  return (
    <div>
      <ul className="divide-y divide-dashed divide-gray-200">
        {plan.map(({ item, qty }) => {
          const menu = menus.get(item.restaurantSlug);
          const full = menu?.find((m) => m.id === item.id);
          const swap = full && menu ? lighterSwap({ ...full, section: full.menuCategory ?? "Other" }, menu) : null;
          return (
            <li key={item.id} className="px-5 py-3">
              <div className="flex items-center gap-3">
                <FoodImage src={item.imageUrl} alt={item.name} tintKey={item.restaurantSlug} variant="thumb" className="h-10 w-10 shrink-0 rounded-md border border-gray-200" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 tabular-nums">
                    {item.restaurantName} · {r((item.calories ?? 0) * qty)} cal · {r((item.protein ?? 0) * qty)} g protein
                  </p>
                </div>
                <span className="flex shrink-0 items-center rounded-md border border-gray-300">
                  <button
                    type="button"
                    onClick={() => (qty > 1 ? setPlanQty(item.id, qty - 1) : undoable(`Removed ${item.name}`, () => setPlanQty(item.id, 0)))}
                    aria-label={`One less ${item.name}`}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <Icon name="remove" className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
                  <button type="button" onClick={() => setPlanQty(item.id, qty + 1)} aria-label={`One more ${item.name}`} className="p-1 text-gray-600 hover:text-gray-900">
                    <Icon name="add" className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              {swap && (
                <button
                  type="button"
                  onClick={() => {
                    setPlanQty(item.id, 0);
                    for (let i = 0; i < qty; i++) addToPlan(toTrayItem(swap.item, item.restaurantName, item.restaurantSlug));
                  }}
                  className="mt-2 ml-13 block text-left text-xs text-accent-ink hover:underline"
                >
                  Lighter swap: {swap.item.name} · −{r(swap.caloriesSaved * qty)} cal
                  {swap.proteinChange !== 0 && `, ${swap.proteinChange > 0 ? "+" : "−"}${r(Math.abs(swap.proteinChange) * qty)} g protein`}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="border-t-2 border-gray-900 px-5 pt-4 pb-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-600">{t.count} {t.count === 1 ? "item" : "items"}</span>
          <span className="text-3xl font-bold text-gray-900 tabular-nums">
            {r(t.calories)} <span className="text-base font-medium text-gray-500">cal</span>
          </span>
        </div>

        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-gray-100" aria-hidden>
          <span style={{ width: `${(kcalP / kcalSum) * 100}%`, background: MACRO_COLORS.protein }} />
          <span style={{ width: `${(kcalC / kcalSum) * 100}%`, background: MACRO_COLORS.carbs }} />
          <span style={{ width: `${(kcalF / kcalSum) * 100}%`, background: MACRO_COLORS.fat }} />
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {(
            [
              ["Protein", t.protein, kcalP, MACRO_COLORS.protein],
              ["Carbs", t.carbs, kcalC, MACRO_COLORS.carbs],
              ["Fat", t.fat, kcalF, MACRO_COLORS.fat],
            ] as const
          ).map(([label, grams, kcal, color]) => (
            <div key={label}>
              <dt className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {label}
              </dt>
              <dd className="text-gray-900 tabular-nums">
                {r(grams)} g <span className="text-xs text-gray-500">{r((kcal / kcalSum) * 100)}%</span>
              </dd>
            </div>
          ))}
        </dl>

        {today.targets && today.left && (
          <p
            className={`mt-4 rounded-md px-3 py-2 text-sm tabular-nums ${
              today.left.calories - t.calories < 0 ? "bg-danger-soft text-danger-ink" : "bg-accent-soft text-accent-ink"
            }`}
          >
            {today.left.calories - t.calories >= 0
              ? `Leaves ${r(today.left.calories - t.calories)} cal for today`
              : `${r(t.calories - today.left.calories)} cal over today's target`}
            {today.left.protein - t.protein > 0 ? ` · ${r(today.left.protein - t.protein)} g protein to go` : " · protein target reached"}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select value={slot} onChange={(e) => setSlot(e.target.value as MealSlot)} aria-label="Log as" className={`${ui.select} h-9`}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {SLOT_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              undoable(`Logged ${t.count} ${t.count === 1 ? "item" : "items"} to ${SLOT_LABELS[slot].toLowerCase()}`, () => logPlan(dayKey(), slot));
            }}
            className={ui.btnPrimary}
          >
            Log to tracker
          </button>
        </div>
        {naming !== null ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const saved = saveOrder(naming);
              setNaming(null);
              if (saved) notify(`Saved “${saved.name}”. Find it in Build and Quick add`);
            }}
          >
            <input autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} aria-label="Order name" className={`${ui.input} h-8`} />
            <button type="submit" className={`${ui.btnSmall} shrink-0`}>
              Save
            </button>
            <button type="button" onClick={() => setNaming(null)} className="shrink-0 text-sm text-gray-600">
              Cancel
            </button>
          </form>
        ) : null}
        <div className="mt-3 flex gap-4 text-sm">
          <button type="button" onClick={() => setNaming(`My usual at ${plan[0].item.restaurantName}`)} className={ui.link}>
            Save order
          </button>
          <button type="button" onClick={copy} className={ui.link}>
            Copy order
          </button>
          <button type="button" onClick={() => undoable("Order cleared", clearPlan)} className="text-gray-600 hover:text-gray-900">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
