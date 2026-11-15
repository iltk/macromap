import { useTracker } from "../../stores/tracker";
import { logWithNotice } from "./logWithNotice";
import { toggleCompare, useTray, type TrayItem } from "../../stores/tray";
import { dayKey } from "../../utils/dates";
import { Icon } from "../ui/icons";

/** "Add" (log to today) and "Compare" controls for a menu item. */
export function ItemActions({ item, iconOnly = false }: { item: TrayItem; iconOnly?: boolean }) {
  const { days } = useTracker();
  const { compare } = useTray();
  const loggedToday = (days[dayKey()] ?? []).filter((e) => e.item.id === item.id).reduce((n, e) => n + e.qty, 0);
  const comparing = compare.some((c) => c.id === item.id);
  const base = "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium";

  return (
    <span className="inline-flex shrink-0 gap-1">
      <button
        type="button"
        onClick={() => logWithNotice(item)}
        title={loggedToday ? `Logged today (×${loggedToday}). Log another` : "Log to today"}
        aria-label={`Log ${item.name} to today`}
        className={`${base} ${loggedToday ? "bg-accent-soft text-accent-ink" : "font-semibold text-accent-ink hover:bg-accent-soft"}`}
      >
        <Icon name={loggedToday ? "check" : "add"} className="h-3.5 w-3.5" />
        <span className={iconOnly ? "sr-only" : ""}>{loggedToday ? `Logged${loggedToday > 1 ? ` ×${loggedToday}` : ""}` : "Add"}</span>
        {iconOnly && loggedToday > 1 && <span className="tabular-nums">{loggedToday}</span>}
      </button>
      <button
        type="button"
        onClick={() => toggleCompare(item)}
        aria-pressed={comparing}
        title={comparing ? "Remove from comparison" : "Compare with another item"}
        aria-label={`${comparing ? "Stop comparing" : "Compare"} ${item.name}`}
        className={`${base} ${comparing ? "bg-accent-soft text-accent-ink" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
      >
        <Icon name="compare" className="h-3.5 w-3.5" />
        <span className={iconOnly ? "sr-only" : ""}>Compare</span>
      </button>
    </span>
  );
}
