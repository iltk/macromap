import { useEffect } from "react";
import { setThemePref, useThemePref, type ThemePref } from "../../stores/theme";
import { setLimits, usePrefs } from "../../stores/prefs";
import { clearAvoid, toggleAvoid } from "../../stores/allergens";
import {
  DEFAULT_TARGET,
  clearCompare,
  clearMeal,
  mealTotals,
  setQty,
  setTarget,
  toggleCompare,
  useTray,
  type DailyTarget,
  type TrayItem,
} from "../../stores/tray";
import { openSheet, useSheet } from "../../stores/ui";
import { ALLERGENS } from "../../utils/allergens";
import { GOALS, NO_LIMITS, goalFor } from "../../utils/goals";
import { MACRO_COLORS, proteinDensity } from "../../utils/macros";
import { RangeField } from "../restaurants/RangeField";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";

/** Right-hand sheets (preferences, meal, compare). Mounted once for the whole app. */
export function Sheets() {
  const sheet = useSheet();

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  if (!sheet) return null;
  const title = { prefs: "Preferences", meal: "Your meal", compare: "Compare" }[sheet];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={() => openSheet(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[400px] flex-col border-l border-gray-200 bg-white"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-5">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={() => openSheet(null)}
            aria-label="Close"
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        {sheet === "prefs" ? <PrefsSheet /> : sheet === "meal" ? <MealSheet /> : <CompareSheet />}
      </div>
    </div>
  );
}

/* ---------- preferences ---------- */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-200 px-5 py-5">
      <h3 className={ui.label}>{title}</h3>
      {hint && <p className={`mt-0.5 ${ui.hint}`}>{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PrefsSheet() {
  const { limits, avoid } = usePrefs();
  const theme = useThemePref();
  const preset = goalFor(limits);

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Goal" hint="Places and menu items are matched against this everywhere in the app.">
        <div className="space-y-1">
          {GOALS.map((g) => (
            <label
              key={g.id}
              className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 ${
                preset?.id === g.id ? "bg-accent-soft" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="goal"
                checked={preset?.id === g.id}
                onChange={() => setLimits(g.limits)}
                className="accent-(--color-accent)"
              />
              <span className="flex-1 text-sm text-gray-900">{g.id === "any" ? "No goal" : g.label}</span>
              {g.id !== "any" && <span className="text-xs text-gray-500">{g.rule}</span>}
            </label>
          ))}
          {!preset && (
            <p className="rounded-md bg-accent-soft px-2.5 py-2 text-sm text-accent-ink">Custom goal (set below)</p>
          )}
        </div>
        <details className="mt-3" open={!preset}>
          <summary className="cursor-pointer text-sm text-gray-600">Fine-tune</summary>
          <div className="mt-3 space-y-4">
            <RangeField
              label="Calories"
              kind="upTo"
              value={limits.maxCalories}
              onChange={(v) => setLimits((l) => ({ ...l, maxCalories: v }))}
              min={100}
              max={1500}
              step={50}
              unit="cal"
            />
            <RangeField
              label="Protein"
              kind="atLeast"
              value={limits.minProtein}
              onChange={(v) => setLimits((l) => ({ ...l, minProtein: v }))}
              min={0}
              max={60}
              step={5}
              unit="g"
            />
            <RangeField
              label="Carbs"
              kind="upTo"
              value={limits.maxCarbs}
              onChange={(v) => setLimits((l) => ({ ...l, maxCarbs: v }))}
              min={0}
              max={150}
              step={5}
              unit="g"
            />
            <button type="button" onClick={() => setLimits(NO_LIMITS)} className={`text-sm ${ui.link}`}>
              Clear goal
            </button>
          </div>
        </details>
      </Section>

      <Section
        title="Avoid allergens"
        hint="Items without allergen info are hidden, never assumed safe. Always check with the restaurant."
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {ALLERGENS.map((a) => (
            <label key={a.code} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={avoid.includes(a.code)}
                onChange={() => toggleAvoid(a.code)}
                className="accent-(--color-accent)"
              />
              {a.label}
            </label>
          ))}
        </div>
        {avoid.length > 0 && (
          <button type="button" onClick={clearAvoid} className={`mt-3 text-sm ${ui.link}`}>
            Clear allergens
          </button>
        )}
      </Section>

      <Section title="Appearance">
        <div className="inline-flex rounded-md border border-gray-300 p-0.5" role="radiogroup" aria-label="Theme">
          {(["system", "light", "dark"] as ThemePref[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              onClick={() => setThemePref(t)}
              className={`rounded px-3 py-1 text-sm capitalize ${
                theme === t ? "bg-gray-900 font-medium text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------- meal ---------- */

const round1 = (n: number) => Math.round(n * 10) / 10;

function MealSheet() {
  const { meal, target } = useTray();
  const totals = mealTotals(meal);

  if (meal.length === 0) {
    return (
      <p className="px-5 py-10 text-sm text-gray-600">
        Your meal is empty. Use <span className="font-semibold">Add</span> on any menu item to start adding up
        calories and macros, even across restaurants.
      </p>
    );
  }

  return (
    <>
      <ul className="flex-1 divide-y divide-gray-200 overflow-y-auto">
        {meal.map(({ item, qty }) => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.restaurantName} · {item.calories ?? "–"} cal · {item.protein ?? "–"} g protein
              </p>
            </div>
            <div className="flex items-center rounded-md border border-gray-300">
              <button type="button" onClick={() => setQty(item.id, qty - 1)} aria-label={`One less ${item.name}`} className="p-1.5 text-gray-600 hover:text-gray-900">
                <Icon name="remove" className="h-4 w-4" />
              </button>
              <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
              <button type="button" onClick={() => setQty(item.id, qty + 1)} aria-label={`One more ${item.name}`} className="p-1.5 text-gray-600 hover:text-gray-900">
                <Icon name="add" className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-2xl font-bold text-gray-900 tabular-nums">{Math.round(totals.calories)} cal</span>
        </div>
        <div className="mt-3 space-y-2.5">
          <TotalRow label="Calories" value={totals.calories} unit="cal" target={target?.calories} color="var(--color-gray-700)" />
          <TotalRow label="Protein" value={totals.protein} unit="g" target={target?.protein} color={MACRO_COLORS.protein} />
          <TotalRow label="Carbs" value={totals.carbs} unit="g" target={target?.carbs} color={MACRO_COLORS.carbs} />
          <TotalRow label="Fat" value={totals.fat} unit="g" target={target?.fat} color={MACRO_COLORS.fat} />
        </div>
        <TargetEditor target={target} />
        <button type="button" onClick={clearMeal} className={`mt-4 text-sm ${ui.link}`}>
          Clear meal
        </button>
      </div>
    </>
  );
}

function TotalRow({ label, value, unit, target, color }: { label: string; value: number; unit: string; target?: number; color: string }) {
  const over = target != null && value > target;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className={`tabular-nums ${over ? "font-semibold text-danger-ink" : "text-gray-900"}`}>
          {round1(value)} {unit}
          {target != null && <span className="text-gray-500"> of {target}</span>}
        </span>
      </div>
      {target != null && (
        <div className="mt-1 h-1 rounded-full bg-gray-200">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, (value / Math.max(1, target)) * 100)}%`, background: over ? "var(--color-danger-ink)" : color }}
          />
        </div>
      )}
    </div>
  );
}

function TargetEditor({ target }: { target: DailyTarget | null }) {
  if (!target) {
    return (
      <button type="button" onClick={() => setTarget(DEFAULT_TARGET)} className={`mt-4 block text-sm ${ui.link}`}>
        Compare with a daily target
      </button>
    );
  }
  const field = (key: keyof DailyTarget, label: string) => (
    <label className="block text-xs text-gray-600">
      {label}
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={target[key]}
        onChange={(e) => setTarget({ ...target, [key]: Math.max(0, Number(e.target.value) || 0) })}
        className={`mt-0.5 ${ui.input} h-8`}
      />
    </label>
  );
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Daily target</span>
        <button type="button" onClick={() => setTarget(null)} className="text-xs text-gray-500 hover:text-gray-900">
          Remove
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {field("calories", "Calories")}
        {field("protein", "Protein (g)")}
        {field("carbs", "Carbs (g)")}
        {field("fat", "Fat (g)")}
      </div>
    </div>
  );
}

/* ---------- compare ---------- */

const ROWS: { label: string; get: (i: TrayItem) => number | null; unit: string; better: "low" | "high" | null }[] = [
  { label: "Calories", get: (i) => i.calories, unit: "cal", better: "low" },
  { label: "Protein", get: (i) => i.protein, unit: "g", better: "high" },
  { label: "Carbs", get: (i) => i.carbs, unit: "g", better: null },
  { label: "Fat", get: (i) => i.fat, unit: "g", better: null },
  { label: "Protein per 100 cal", get: (i) => proteinDensity(i), unit: "g", better: "high" },
];

function CompareSheet() {
  const { compare } = useTray();
  const [a, b] = compare;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {compare.length < 2 && (
        <p className="mb-4 text-sm text-gray-600">
          Choose {compare.length === 0 ? "two items" : "one more item"} with <span className="font-semibold">Compare</span> on any menu.
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
        <button type="button" onClick={clearCompare} className={`mt-4 text-sm ${ui.link}`}>
          Clear comparison
        </button>
      )}
    </div>
  );
}
