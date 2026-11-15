import { useMemo, useState } from "react";
import { useTracker } from "../../stores/tracker";
import { dayKey } from "../../utils/dates";
import { downloadText } from "../../utils/download";
import { daySeries, logToCsv, weeklyCheckIn } from "../../utils/history";
import { DayBarChart } from "../charts/DayBarChart";
import { ui } from "../ui/styles";
import { EmptyState } from "../ui/EmptyState";
import { Segmented } from "../ui/Segmented";

export function HistoryView({ onOpenDay }: { onOpenDay: (key: string) => void }) {
  const { days, targets } = useTracker();
  const [range, setRange] = useState<7 | 30>(7);
  const points = useMemo(() => daySeries(days, dayKey(), range), [days, range]);
  const logged = points.filter((p) => p.logged);
  const avg = (f: (p: (typeof points)[number]) => number) => (logged.length ? logged.reduce((s, p) => s + f(p), 0) / logged.length : 0);
  const checkIn = useMemo(() => weeklyCheckIn(days, dayKey(), targets), [days, targets]);
  const onTarget = targets ? logged.filter((p) => Math.abs(p.calories - targets.calories) <= targets.calories * 0.1).length : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Range"
          value={String(range) as "7" | "30"}
          onChange={(v) => setRange(v === "7" ? 7 : 30)}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
        <button type="button" disabled={Object.keys(days).length === 0} onClick={() => downloadText(`macromap-log-${dayKey()}.csv`, logToCsv(days))} className={ui.btn}>
          Export CSV
        </button>
      </div>

      {checkIn && (
        <section className="rounded-xl border border-accent/30 bg-accent-soft px-5 py-4">
          <p className="text-xs font-medium text-accent-ink">Your week (last 7 full days)</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{checkIn.headline}</p>
          {checkIn.details.length > 0 && <p className="mt-1 text-sm text-gray-700">{checkIn.details.join(" ")}</p>}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Avg calories", logged.length ? Math.round(avg((p) => p.calories)).toLocaleString() : "–"],
          ["Avg protein", logged.length ? `${Math.round(avg((p) => p.protein))} g` : "–"],
          ["Days logged", `${logged.length} of ${range}`],
          ["Near calorie target", onTarget === null ? "Set targets" : `${onTarget} of ${logged.length}`],
        ].map(([label, v]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{v}</p>
          </div>
        ))}
      </section>

      {logged.length === 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            art="plate"
            title={`Nothing logged in the last ${range} days`}
            text="Charts and averages appear once you've logged a few meals."
            action={
              <button type="button" onClick={() => onOpenDay(dayKey())} className={ui.btnPrimary}>
                Go to today
              </button>
            }
          />
        </section>
      ) : (
      <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-4">
        <DayBarChart title="Calories" points={points} value={(p) => p.calories} unit="cal" target={targets?.calories ?? null} color="var(--color-gray-700)" />
        <DayBarChart title="Protein (g)" points={points} value={(p) => p.protein} unit="g protein" target={targets?.protein ?? null} color="var(--color-protein)" />
        {targets && <p className="text-xs text-gray-500">“Near calorie target” counts logged days within 10% of {targets.calories} cal.</p>}
      </section>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Day</th>
              <th className="px-4 py-2 text-right font-medium">Calories</th>
              <th className="px-4 py-2 text-right font-medium">Protein</th>
              <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Carbs</th>
              <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Fat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...points].reverse().map((p) => (
              <tr key={p.key} className="hover:bg-row-hover">
                <td className="px-4 py-2">
                  <button type="button" onClick={() => onOpenDay(p.key)} className={ui.link}>
                    {p.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </button>
                </td>
                {p.logged ? (
                  <>
                    <td className="px-4 py-2 text-right tabular-nums">{Math.round(p.calories)}</td>
                    <td className="px-4 py-2 text-right text-accent-ink tabular-nums">{Math.round(p.protein)} g</td>
                    <td className="hidden px-4 py-2 text-right tabular-nums sm:table-cell">{Math.round(p.carbs)} g</td>
                    <td className="hidden px-4 py-2 text-right tabular-nums sm:table-cell">{Math.round(p.fat)} g</td>
                  </>
                ) : (
                  <td colSpan={4} className="px-4 py-2 text-right text-gray-400">
                    Nothing logged
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-gray-500">Your log is saved in this browser only. Export it to keep a copy.</p>
    </div>
  );
}
