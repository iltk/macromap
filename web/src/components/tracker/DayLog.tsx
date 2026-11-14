import { Link } from "react-router";
import { moveEntry, removeEntry, setEntryQty, SLOT_LABELS, SLOTS, totalsOf, type LogEntry, type MealSlot } from "../../stores/tracker";
import { timeLabel } from "../../utils/dates";
import { FoodImage } from "../media/FoodImage";
import { Icon } from "../ui/icons";
import { ui } from "../ui/styles";

export function DayLog({ date, entries }: { date: string; entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <p className="font-medium text-gray-900">Nothing logged yet</p>
        <p className="mt-1 text-sm text-gray-600">Tap “Add” on any menu item to log it here.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/" className={ui.btn}>
            Find food nearby
          </Link>
          <Link to="/restaurants" className={ui.btn}>
            Browse menus
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {SLOTS.map((slot) => {
        const list = entries.filter((e) => e.slot === slot);
        const t = totalsOf(list);
        return (
          <section key={slot} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <header className="flex items-baseline justify-between border-b border-gray-100 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-gray-900">{SLOT_LABELS[slot]}</h3>
              <span className="text-xs text-gray-500 tabular-nums">
                {list.length ? `${Math.round(t.calories)} cal · ${Math.round(t.protein)} g protein` : "Nothing logged"}
              </span>
            </header>
            {list.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {list.map((e) => (
                  <EntryRow key={e.id} date={date} entry={e} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function EntryRow({ date, entry }: { date: string; entry: LogEntry }) {
  const { item, qty } = entry;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <FoodImage src={item.imageUrl} alt={item.name} tintKey={item.restaurantSlug} variant="thumb" className="h-11 w-11 shrink-0 rounded-md border border-gray-200" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
        <p className="truncate text-xs text-gray-500">
          {item.restaurantName} · {timeLabel(entry.addedAt)} ·{" "}
          <span className="tabular-nums">
            {Math.round((item.calories ?? 0) * qty)} cal · <span className="text-accent-ink">{Math.round((item.protein ?? 0) * qty)} g protein</span>
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center rounded-md border border-gray-300">
        <button type="button" onClick={() => setEntryQty(date, entry.id, qty - 1)} aria-label={`One less ${item.name}`} className="p-1.5 text-gray-600 hover:text-gray-900">
          <Icon name="remove" className="h-3.5 w-3.5" />
        </button>
        <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
        <button type="button" onClick={() => setEntryQty(date, entry.id, qty + 1)} aria-label={`One more ${item.name}`} className="p-1.5 text-gray-600 hover:text-gray-900">
          <Icon name="add" className="h-3.5 w-3.5" />
        </button>
      </div>
      <select
        value={entry.slot}
        onChange={(e) => moveEntry(date, entry.id, e.target.value as MealSlot)}
        aria-label={`Move ${item.name} to another meal`}
        className={`${ui.select} hidden h-8 sm:block`}
      >
        {SLOTS.map((s) => (
          <option key={s} value={s}>
            {SLOT_LABELS[s]}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => removeEntry(date, entry.id)} aria-label={`Remove ${item.name}`} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
        <Icon name="close" className="h-4 w-4" />
      </button>
    </li>
  );
}
