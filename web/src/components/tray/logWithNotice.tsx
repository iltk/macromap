import { Link } from "react-router";
import { notify } from "../../stores/notify";
import { logItem, moveEntry, removeEntry, SLOT_LABELS, SLOTS, type MealSlot } from "../../stores/tracker";
import type { TrayItem } from "../../stores/tray";

/** Logs an item to today and offers to change the meal or undo. */
export function logWithNotice(item: TrayItem) {
  const entry = logItem(item);
  notify(`Logged ${item.name}`, (close) => (
    <span className="flex shrink-0 items-center gap-2">
      <select
        defaultValue={entry.slot}
        onChange={(e) => moveEntry(entry.date, entry.id, e.target.value as MealSlot)}
        aria-label="Meal"
        className="h-7 rounded border border-white/30 bg-transparent px-1 text-sm text-white [&>option]:text-gray-900"
      >
        {SLOTS.map((s) => (
          <option key={s} value={s}>
            {SLOT_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          removeEntry(entry.date, entry.id);
          close();
        }}
        className="font-semibold text-white underline underline-offset-2"
      >
        Undo
      </button>
      <Link to="/tracker" onClick={close} className="text-white/80 hover:text-white">
        View
      </Link>
    </span>
  ));
}
