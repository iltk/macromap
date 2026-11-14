import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { SiteHeader } from "../components/layout/SiteHeader";
import { DayLog } from "../components/tracker/DayLog";
import { DaySummary } from "../components/tracker/DaySummary";
import { PlanCard } from "../components/tracker/PlanCard";
import { Icon } from "../components/ui/icons";
import { ui } from "../components/ui/styles";
import { totalsOf, useTracker } from "../stores/tracker";
import { openSheet } from "../stores/ui";
import { dayKey, dayLabel, isDayKey, shiftDay } from "../utils/dates";

export function TrackerPage() {
  const [params, setParams] = useSearchParams();
  const today = dayKey();
  const raw = params.get("date");
  const date = isDayKey(raw) && raw <= today ? raw : today;
  const { days, targets } = useTracker();
  const entries = days[date] ?? [];
  const totals = totalsOf(entries);

  useEffect(() => {
    document.title = "Tracker · MacroMap";
  }, []);

  const go = (key: string) => setParams(key === today ? {} : { date: key }, { replace: true });

  return (
    <div className="min-h-dvh bg-page">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <h1 className="mr-3 text-2xl font-bold text-gray-900">Tracker</h1>
            <button type="button" onClick={() => go(shiftDay(date, -1))} aria-label="Previous day" className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100">
              <Icon name="arrowBack" className="h-4 w-4" />
            </button>
            <span className="min-w-[7rem] text-center text-sm font-medium text-gray-900">{dayLabel(date, today)}</span>
            <button
              type="button"
              onClick={() => go(shiftDay(date, 1))}
              disabled={date >= today}
              aria-label="Next day"
              className="rotate-180 rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              <Icon name="arrowBack" className="h-4 w-4" />
            </button>
            {date !== today && (
              <button type="button" onClick={() => go(today)} className={`ml-1 text-sm ${ui.link}`}>
                Back to today
              </button>
            )}
          </div>
          <button type="button" onClick={() => openSheet("targets")} className={ui.btn}>
            <Icon name="tune" className="h-4 w-4" />
            {targets ? `Targets: ${targets.calories} cal` : "Set targets"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            <DaySummary totals={totals} targets={targets} isToday={date === today} />
            <DayLog date={date} entries={entries} />
          </div>
          <div className="min-w-0 space-y-5 lg:sticky lg:top-20 lg:self-start">
            <PlanCard date={date} dayTotals={totals} targets={targets} />
            <p className="px-1 text-xs text-gray-500">Your log is saved in this browser only.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
