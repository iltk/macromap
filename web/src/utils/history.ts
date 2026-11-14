import type { LogEntry } from "../stores/tracker";
import { totalsOf } from "../stores/tracker";
import type { TrayItem } from "../stores/tray";
import { parseDayKey, shiftDay } from "./dates";

export interface DayPoint {
  key: string;
  date: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: number;
  logged: boolean;
}

/** One point per calendar day for the `n` days ending on `endKey` (oldest first). */
export function daySeries(days: Record<string, LogEntry[]>, endKey: string, n: number): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = shiftDay(endKey, -i);
    const entries = days[key] ?? [];
    const t = totalsOf(entries);
    out.push({ key, date: parseDayKey(key), calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat, items: t.count, logged: entries.length > 0 });
  }
  return out;
}

/** Distinct items from the log, most recently logged first. */
export function recentItems(days: Record<string, LogEntry[]>, limit = 12): TrayItem[] {
  const seen = new Map<string, { item: TrayItem; at: string }>();
  for (const entries of Object.values(days)) {
    for (const e of entries) {
      const prev = seen.get(e.item.id);
      if (!prev || e.addedAt > prev.at) seen.set(e.item.id, { item: e.item, at: e.addedAt });
    }
  }
  return [...seen.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit).map((x) => x.item);
}

const csvCell = (v: string | number | null) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every log entry as CSV (one row per entry, quantities applied to the macros). */
export function logToCsv(days: Record<string, LogEntry[]>): string {
  const header = ["date", "time", "meal", "item", "restaurant", "quantity", "calories", "protein_g", "carbs_g", "fat_g"];
  const rows = Object.keys(days)
    .sort()
    .flatMap((date) =>
      [...days[date]]
        .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
        .map((e) => [
          date,
          new Date(e.addedAt).toTimeString().slice(0, 5),
          e.slot,
          e.item.name,
          e.item.restaurantName,
          e.qty,
          Math.round((e.item.calories ?? 0) * e.qty),
          Math.round((e.item.protein ?? 0) * e.qty * 10) / 10,
          Math.round((e.item.carbs ?? 0) * e.qty * 10) / 10,
          Math.round((e.item.fat ?? 0) * e.qty * 10) / 10,
        ]),
    );
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

/** Triggers a browser download of `text` as a file. */
export function downloadText(filename: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
