/**
 * Small parser for the common subset of OpenStreetMap `opening_hours` syntax:
 *   "24/7", "Mo-Fr 06:00-22:00; Sa,Su 07:00-21:00", "Mo-Su 05:00-01:00", "Su off".
 * Anything fancier (holidays, months, week numbers…) returns null = "unknown".
 */
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Interval = [number, number]; // minutes from that day's midnight; end may exceed 1440
type Week = Interval[][]; // index 0 = Monday

function parseDays(spec: string): number[] | null {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const range = part.trim().split("-");
    const a = DAYS.indexOf(range[0] as (typeof DAYS)[number]);
    if (a < 0) return null;
    if (range.length === 1) {
      out.add(a);
      continue;
    }
    const b = DAYS.indexOf(range[1] as (typeof DAYS)[number]);
    if (b < 0) return null;
    for (let i = a; ; i = (i + 1) % 7) {
      out.add(i);
      if (i === b) break;
    }
  }
  return [...out];
}

function toMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function parseOpeningHours(raw: string | null | undefined): Week | null {
  if (!raw) return null;
  const text = raw.trim();
  const week: Week = DAYS.map(() => []);
  if (text === "24/7") {
    return week.map(() => [[0, 1440]]);
  }
  for (const rule of text.split(";").map((r) => r.trim()).filter(Boolean)) {
    const m = /^([A-Za-z,\- ]+?)\s+(.+)$/.exec(rule);
    let days: number[] | null;
    let times: string;
    if (m && /^[A-Z][a-z]/.test(m[1])) {
      days = parseDays(m[1].replace(/\s/g, ""));
      times = m[2].trim();
    } else {
      days = [0, 1, 2, 3, 4, 5, 6];
      times = rule;
    }
    if (!days) return null;
    if (times === "off" || times === "closed") {
      for (const d of days) week[d] = [];
      continue;
    }
    const intervals: Interval[] = [];
    for (const span of times.split(",")) {
      const [s, e] = span.split("-");
      if (e === undefined) return null;
      const start = toMinutes(s);
      let end = toMinutes(e.replace("+", ""));
      if (start === null || end === null) return null;
      if (end <= start) end += 1440; // closes after midnight
      intervals.push([start, end]);
    }
    for (const d of days) week[d] = intervals;
  }
  return week;
}

interface OpenStatus {
  open: boolean;
  label: string; // e.g. "Open · Closes 22:00"
}

const fmt = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export function getOpenStatus(raw: string | null | undefined, now = new Date()): OpenStatus | null {
  const week = parseOpeningHours(raw);
  if (!week) return null;
  if (week.every((d) => d.length === 1 && d[0][0] === 0 && d[0][1] >= 1440)) {
    return { open: true, label: "Open 24 hours" };
  }
  const today = (now.getDay() + 6) % 7;
  const yesterday = (today + 6) % 7;
  const minutes = now.getHours() * 60 + now.getMinutes();

  for (const [s, e] of week[today]) {
    if (minutes >= s && minutes < e) return { open: true, label: `Open · Closes ${fmt(e)}` };
  }
  for (const [, e] of week[yesterday]) {
    if (e > 1440 && minutes < e - 1440) return { open: true, label: `Open · Closes ${fmt(e)}` };
  }
  // find the next opening in the coming week
  for (let offset = 0; offset < 7; offset++) {
    const day = (today + offset) % 7;
    const next = week[day]
      .map(([s]) => s)
      .filter((s) => offset > 0 || s > minutes)
      .sort((a, b) => a - b)[0];
    if (next !== undefined) {
      const when = offset === 0 ? "" : offset === 1 ? " tomorrow" : ` ${DAY_NAMES[day].slice(0, 3)}`;
      return { open: false, label: `Closed · Opens ${fmt(next)}${when}` };
    }
  }
  return { open: false, label: "Closed" };
}

/** Human-readable weekly schedule, or null when unparseable. */
export function weeklySchedule(raw: string | null | undefined): { day: string; hours: string }[] | null {
  const week = parseOpeningHours(raw);
  if (!week) return null;
  return week.map((intervals, i) => ({
    day: DAY_NAMES[i],
    hours:
      intervals.length === 0
        ? "Closed"
        : intervals.some(([s, e]) => s === 0 && e >= 1440)
          ? "Open 24 hours"
          : intervals.map(([s, e]) => `${fmt(s)}–${fmt(e)}`).join(", "),
  }));
}
