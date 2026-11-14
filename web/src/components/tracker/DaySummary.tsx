import type { Totals } from "../../stores/tracker";
import { openSheet } from "../../stores/ui";
import { MACRO_COLORS } from "../../utils/macros";
import type { DailyTarget } from "../../utils/targets";
import { ui } from "../ui/styles";

const r = (n: number) => Math.round(n);

export function DaySummary({ totals, targets, isToday }: { totals: Totals; targets: DailyTarget | null; isToday: boolean }) {
  if (!targets) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-600">{isToday ? "Eaten today" : "Eaten that day"}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900 tabular-nums">{r(totals.calories)} cal</p>
        <p className="mt-1 text-sm text-gray-600 tabular-nums">
          <span className="text-accent-ink">{r(totals.protein)} g protein</span> · {r(totals.carbs)} g carbs · {r(totals.fat)} g fat
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">Set daily targets to see what's left and get suggestions.</p>
          <button type="button" onClick={() => openSheet("targets")} className={ui.btnPrimary}>
            Set targets
          </button>
        </div>
      </section>
    );
  }

  const left = targets.calories - totals.calories;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-gray-600">{left >= 0 ? "Calories left" : "Over by"}</p>
          <p className={`mt-1 text-3xl font-bold tabular-nums ${left < 0 ? "text-danger-ink" : "text-gray-900"}`}>{Math.abs(r(left))}</p>
        </div>
        <p className="text-sm text-gray-500 tabular-nums">
          {r(totals.calories)} eaten of {targets.calories}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="Calories" value={totals.calories} target={targets.calories} unit="cal" color="var(--color-gray-700)" />
        <Bar label="Protein" value={totals.protein} target={targets.protein} unit="g" color={MACRO_COLORS.protein} />
        <Bar label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" color={MACRO_COLORS.carbs} />
        <Bar label="Fat" value={totals.fat} target={targets.fat} unit="g" color={MACRO_COLORS.fat} />
      </div>
    </section>
  );
}

function Bar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const over = value > target;
  const left = target - value;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-gray-800">{label}</span>
        <span className="text-gray-500 tabular-nums">
          <span className={over ? "font-semibold text-danger-ink" : "text-gray-900"}>{r(value)}</span> / {target} {unit}
          <span className="ml-2 inline-block w-16 text-right text-xs">{over ? `${r(-left)} over` : `${r(left)} left`}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / Math.max(1, target)) * 100)}%`, background: over ? "var(--color-danger-ink)" : color }} />
      </div>
    </div>
  );
}
