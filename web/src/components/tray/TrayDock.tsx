import { useEffect } from "react";
import {
  DEFAULT_TARGET,
  clearCompare,
  clearMeal,
  mealTotals,
  openTray,
  setQty,
  setTarget,
  toggleCompare,
  useTray,
  type DailyTarget,
  type TrayItem,
} from "../../stores/tray";
import { MACRO_COLORS, proteinDensity } from "../../utils/macros";
import { Icon } from "../ui/icons";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Floating meal/compare dock plus the meal drawer and compare sheet. Mounted once for all pages. */
export function TrayDock() {
  const tray = useTray();
  const totals = mealTotals(tray.meal);

  useEffect(() => {
    if (!tray.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openTray(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tray.open]);

  const showDock = (tray.meal.length > 0 || tray.compare.length > 0) && !tray.open;

  return (
    <>
      {showDock && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-2">
          {tray.meal.length > 0 && (
            <button
              type="button"
              onClick={() => openTray("meal")}
              className="flex items-center gap-2 rounded-full bg-gray-900 py-2.5 pr-4 pl-3 text-sm font-semibold text-white shadow-lg hover:bg-gray-800"
            >
              <Icon name="meal" className="h-4 w-4" />
              Meal · {totals.count} {totals.count === 1 ? "item" : "items"} · {Math.round(totals.calories)} kcal
            </button>
          )}
          {tray.compare.length > 0 && (
            <button
              type="button"
              onClick={() => openTray("compare")}
              className="flex items-center gap-2 rounded-full bg-[#1a73e8] py-2.5 pr-4 pl-3 text-sm font-semibold text-white shadow-lg hover:bg-[#1765cc]"
            >
              <Icon name="compare" className="h-4 w-4" />
              Compare {tray.compare.length}/2
            </button>
          )}
        </div>
      )}

      {tray.open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => openTray(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tray.open === "meal" ? "Your meal" : "Compare items"}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl"
          >
            {tray.open === "meal" ? (
              <MealDrawer />
            ) : (
              <CompareSheet items={tray.compare} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DrawerHeader({ title, onClear, clearLabel }: { title: string; onClear?: () => void; clearLabel: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <h2 className="text-lg font-black text-gray-900">{title}</h2>
      <div className="flex items-center gap-2">
        {onClear && (
          <button type="button" onClick={onClear} className="text-sm font-semibold text-[#1a73e8] hover:underline">
            {clearLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => openTray(null)}
          aria-label="Close"
          className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function MealDrawer() {
  const { meal, target } = useTray();
  const totals = mealTotals(meal);

  return (
    <>
      <DrawerHeader title="Your meal" onClear={meal.length ? clearMeal : undefined} clearLabel="Clear" />
      <div className="flex-1 overflow-y-auto">
        {meal.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            Add items with the <span className="font-semibold">+ Meal</span> button on any menu.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {meal.map(({ item, qty }) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.restaurantName} · {item.calories ?? "–"} kcal · P {item.protein ?? "–"} g
                  </p>
                </div>
                <div className="flex items-center rounded-full border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty - 1)}
                    aria-label={`One less ${item.name}`}
                    className="p-1.5 text-gray-700 hover:text-gray-900"
                  >
                    <Icon name="remove" className="h-4 w-4" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty + 1)}
                    aria-label={`One more ${item.name}`}
                    className="p-1.5 text-gray-700 hover:text-gray-900"
                  >
                    <Icon name="add" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {meal.length > 0 && (
        <div className="border-t-4 border-gray-900 px-5 py-4">
          <div className="flex items-end justify-between">
            <span className="text-sm font-extrabold text-gray-900">Total calories</span>
            <span className="text-3xl leading-none font-black text-gray-900 tabular-nums">
              {Math.round(totals.calories)}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <TotalRow label="Calories" value={totals.calories} unit="kcal" target={target?.calories} color="#202124" />
            <TotalRow label="Protein" value={totals.protein} unit="g" target={target?.protein} color={MACRO_COLORS.protein} />
            <TotalRow label="Carbs" value={totals.carbs} unit="g" target={target?.carbs} color={MACRO_COLORS.carbs} />
            <TotalRow label="Fat" value={totals.fat} unit="g" target={target?.fat} color={MACRO_COLORS.fat} />
          </div>
          <TargetEditor target={target} />
        </div>
      )}
    </>
  );
}

function TotalRow({
  label,
  value,
  unit,
  target,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  target?: number;
  color: string;
}) {
  const pct = target ? Math.min(100, (value / target) * 100) : null;
  const over = target != null && value > target;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-gray-900">{label}</span>
        <span className={`tabular-nums ${over ? "font-semibold text-[#d93025]" : "text-gray-700"}`}>
          {fmt(Math.round(value * 10) / 10)} {unit}
          {target != null && <span className="text-gray-500"> / {target} {unit}</span>}
        </span>
      </div>
      {pct !== null && (
        <div className="mt-1 h-1.5 rounded-full bg-gray-100">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: over ? "#d93025" : color }} />
        </div>
      )}
    </div>
  );
}

function TargetEditor({ target }: { target: DailyTarget | null }) {
  if (!target) {
    return (
      <button
        type="button"
        onClick={() => setTarget(DEFAULT_TARGET)}
        className="mt-4 text-sm font-semibold text-[#1a73e8] hover:underline"
      >
        Compare against a daily target →
      </button>
    );
  }
  const field = (key: keyof DailyTarget, label: string, unit: string) => (
    <label className="block text-xs text-gray-600">
      {label}
      <span className="mt-0.5 flex items-center gap-1 rounded-md border border-gray-300 px-2 focus-within:border-gray-900">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={target[key]}
          onChange={(e) => setTarget({ ...target, [key]: Math.max(0, Number(e.target.value) || 0) })}
          className="h-8 w-full bg-transparent text-sm text-gray-900 outline-none"
        />
        <span className="text-gray-400">{unit}</span>
      </span>
    </label>
  );
  return (
    <div className="mt-4 rounded-lg bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.12em] text-gray-500 uppercase">Daily target</p>
        <button type="button" onClick={() => setTarget(null)} className="text-xs text-gray-500 hover:text-gray-900">
          Remove
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {field("calories", "Calories", "kcal")}
        {field("protein", "Protein", "g")}
        {field("carbs", "Carbs", "g")}
        {field("fat", "Fat", "g")}
      </div>
    </div>
  );
}

const COMPARE_ROWS: { label: string; get: (i: TrayItem) => number | null; unit: string; better: "low" | "high" | null }[] = [
  { label: "Calories", get: (i) => i.calories, unit: "kcal", better: "low" },
  { label: "Protein", get: (i) => i.protein, unit: "g", better: "high" },
  { label: "Carbs", get: (i) => i.carbs, unit: "g", better: null },
  { label: "Fat", get: (i) => i.fat, unit: "g", better: null },
  { label: "Protein / 100 kcal", get: (i) => proteinDensity(i), unit: "g", better: "high" },
];

function CompareSheet({ items }: { items: TrayItem[] }) {
  const [a, b] = items;
  return (
    <>
      <DrawerHeader title="Compare" onClear={items.length ? clearCompare : undefined} clearLabel="Clear" />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {items.length < 2 && (
          <p className="mb-4 rounded-lg bg-[#e8f0fe] px-3 py-2 text-sm text-[#1967d2]">
            Pick {items.length === 0 ? "two items" : "one more item"} with the <span className="font-semibold">Compare</span> button.
          </p>
        )}
        {items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-4 border-gray-900 align-bottom">
                <th className="w-28 py-2 text-left text-xs font-semibold text-gray-500" />
                {[a, b].map((it, i) => (
                  <th key={i} className="px-2 py-2 text-left">
                    {it ? (
                      <>
                        <span className="block text-sm leading-snug font-extrabold text-gray-900">{it.name}</span>
                        <span className="block text-xs font-normal text-gray-500">
                          {it.restaurantName}
                          {it.servingSize && ` · ${it.servingSize}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCompare(it)}
                          className="mt-1 text-xs font-medium text-[#1a73e8] hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-normal text-gray-400">Pick another item</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => {
                const va = a ? row.get(a) : null;
                const vb = b ? row.get(b) : null;
                const winner =
                  row.better && va != null && vb != null && va !== vb
                    ? (row.better === "low" ? va < vb : va > vb)
                      ? 0
                      : 1
                    : null;
                return (
                  <tr key={row.label} className="border-b border-gray-200">
                    <th scope="row" className="py-2.5 text-left font-semibold text-gray-700">
                      {row.label}
                    </th>
                    {[va, vb].map((v, i) => (
                      <td
                        key={i}
                        className={`px-2 py-2.5 tabular-nums ${
                          winner === i ? "font-bold text-[#137333]" : "text-gray-900"
                        }`}
                      >
                        {v == null ? "–" : `${fmt(Math.round(v * 10) / 10)} ${row.unit}`}
                        {winner === i && <Icon name="check" className="ml-1 inline h-4 w-4" title="Better" />}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {a && b && (
          <p className="mt-4 text-xs text-gray-500">
            Green marks fewer calories, more protein and more protein per calorie.
          </p>
        )}
      </div>
    </>
  );
}
