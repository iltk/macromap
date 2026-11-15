import type { LogEntry } from "../stores/tracker";
import { totalsOf } from "../stores/tracker";
import type { ItemRef } from "../stores/compare";
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
export function recentItems(days: Record<string, LogEntry[]>, limit = 12): ItemRef[] {
  const seen = new Map<string, { item: ItemRef; at: string }>();
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

interface CheckIn {
  headline: string;
  details: string[];
}

const avgOf = (pts: DayPoint[], f: (p: DayPoint) => number) =>
  pts.length ? pts.reduce((s, p) => s + f(p), 0) / pts.length : null;

/** Last 7 full days against the 7 before, averaging logged days only (a skipped day isn't 0 cal). */
export function weeklyCheckIn(days: Record<string, LogEntry[]>, today: string, targets: { calories: number; protein: number } | null): CheckIn | null {
  // today is still in progress, so the week ends yesterday
  const pts = daySeries(days, shiftDay(today, -1), 14);
  const prev = pts.slice(0, 7).filter((p) => p.logged);
  const curr = pts.slice(7).filter((p) => p.logged);
  if (curr.length === 0) return null;

  const pNow = avgOf(curr, (p) => p.protein)!;
  const cNow = avgOf(curr, (p) => p.calories)!;
  const pPrev = avgOf(prev, (p) => p.protein);
  const cPrev = avgOf(prev, (p) => p.calories);
  const details: string[] = [];

  let headline: string;
  if (pPrev !== null && cPrev !== null) {
    const dp = Math.round(pNow - pPrev);
    const dc = Math.round(cNow - cPrev);
    const proteinPart = Math.abs(dp) < 3 ? "Protein steady" : dp > 0 ? `Protein up ${dp} g a day` : `Protein down ${-dp} g a day`;
    const calPart = Math.abs(dc) < 75 ? "calories steady" : dc > 0 ? `calories up ${dc}` : `calories down ${-dc}`;
    headline = `${proteinPart}, ${calPart} on last week.`;
  } else {
    headline = `First week tracked: ${Math.round(pNow)} g protein and ${Math.round(cNow).toLocaleString()} cal a day on average.`;
  }

  details.push(`${curr.length} of 7 days logged${prev.length ? ` (${prev.length} the week before)` : ""}.`);
  if (targets) {
    const hitProtein = curr.filter((p) => p.protein >= targets.protein * 0.9).length;
    if (hitProtein > 0) details.push(`Protein target hit on ${hitProtein} ${hitProtein === 1 ? "day" : "days"}.`);
    const nearCal = curr.filter((p) => Math.abs(p.calories - targets.calories) <= targets.calories * 0.1).length;
    if (nearCal > 0) details.push(`Within 10% of your calorie target on ${nearCal} ${nearCal === 1 ? "day" : "days"}.`);
  }
  return { headline, details };
}
