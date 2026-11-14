/** Local calendar day as YYYY-MM-DD (tracker days follow the viewer's clock). */
export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export const isDayKey = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function shiftDay(key: string, days: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + days);
  return dayKey(d);
}

/** "Today", "Yesterday", "Tomorrow" or e.g. "Wed, Nov 12". */
export function dayLabel(key: string, today = dayKey()): string {
  if (key === today) return "Today";
  if (key === shiftDay(today, -1)) return "Yesterday";
  if (key === shiftDay(today, 1)) return "Tomorrow";
  return parseDayKey(key).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
