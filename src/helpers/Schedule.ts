import { RRule } from "rrule";
import { UserHelper } from "@churchapps/apphelper";
import { type ScheduleEntry } from "./interfaces";

export interface Occurrence {
  entry: ScheduleEntry;
  start: Date;
  end: Date;
}

export const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// Schedule times are church wall-clock; they live in UTC-field Dates so the browser timezone never shifts them.
export const parseWall = (value?: Date | string): Date | null => {
  if (!value) return null;
  const s = typeof value === "string" ? value : value.toISOString();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)));
};

const pad = (n: number) => n.toString().padStart(2, "0");

export const formatWall = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

export const wallDateKey = (d: Date) => formatWall(d).slice(0, 10);

export const wallTimeKey = (d: Date) => formatWall(d).slice(11, 16);

export const churchTimeZone = (): string => {
  const church = UserHelper.currentUserChurch?.church as { timeZone?: string } | undefined;
  return church?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const nowWall = (timeZone: string, at = new Date()): Date => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(at);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
    return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second")));
  } catch {
    return new Date(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes(), at.getSeconds()));
  }
};

export const formatWallTime = (d: Date) => {
  const h = d.getUTCHours();
  return `${h % 12 || 12}:${pad(d.getUTCMinutes())} ${h < 12 ? "AM" : "PM"}`;
};

export const formatWallDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });

export const formatWallDate = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const expandEntry = (entry: ScheduleEntry, from: Date, to: Date, max = 500): Occurrence[] => {
  const start = parseWall(entry.start);
  const end = parseWall(entry.end);
  if (!start || !end) return [];
  const duration = Math.max(end.getTime() - start.getTime(), 0);
  const single = start < to && end > from ? [{ entry, start, end }] : [];
  if (!entry.recurrenceRule) return single;
  const excluded = new Set((entry.exceptionDates || []).map((d) => { const w = parseWall(d); return w ? wallDateKey(w) : ""; }));
  let dates: Date[];
  try {
    const rule = new RRule({ ...RRule.parseString(entry.recurrenceRule.replace(/^RRULE:/, "")), dtstart: start });
    dates = rule.between(new Date(from.getTime() - duration), to, true).slice(0, max);
  } catch {
    return single;
  }
  return dates
    .filter((d) => !excluded.has(wallDateKey(d)))
    .map((d) => ({ entry, start: d, end: new Date(d.getTime() + duration) }))
    .filter((o) => o.end > from);
};

export const expandEntries = (entries: ScheduleEntry[], from: Date, to: Date) => entries
  .filter((e) => e.enabled !== false)
  .flatMap((e) => expandEntry(e, from, to))
  .sort((a, b) => a.start.getTime() - b.start.getTime());

export const activeOccurrence = (occurrences: Occurrence[], at: Date): Occurrence | null => {
  let best: Occurrence | null = null;
  for (const o of occurrences) {
    if (o.start <= at && o.end > at && (!best || o.start > best.start)) best = o;
  }
  return best;
};

export interface RuleParts {
  days: number[];
  until?: string;
}

export const parseRule = (rule?: string): RuleParts | null => {
  if (!rule) return null;
  const byDay = rule.match(/BYDAY=([A-Z,]+)/)?.[1] || "";
  const until = rule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
  return {
    days: byDay.split(",").map((c) => DAY_CODES.indexOf(c)).filter((i) => i >= 0),
    until: until ? `${until[1]}-${until[2]}-${until[3]}` : undefined
  };
};

export const buildRule = (days: number[], until?: string) => {
  const sorted = [...days].sort((a, b) => a - b);
  let rule = "FREQ=WEEKLY;BYDAY=" + sorted.map((d) => DAY_CODES[d]).join(",");
  if (until) rule += ";UNTIL=" + until.replace(/-/g, "") + "T235959Z";
  return rule;
};
