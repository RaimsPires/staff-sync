import type { JobTitle } from "@/types/employee";

/** Day 0 is the Monday of the week the app was opened in; day indexes count from there (negative = earlier weeks). */
const NOW = new Date();
const LOCAL_TODAY_UTC = Date.UTC(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
export const BASE_UTC = LOCAL_TODAY_UTC - ((NOW.getDay() + 6) % 7) * 86_400_000;
export const TODAY_INDEX = Math.round((LOCAL_TODAY_UTC - BASE_UTC) / 86_400_000);
/** Today's date as `YYYY-MM-DD`. */
export const TODAY_ISO = new Date(LOCAL_TODAY_UTC).toISOString().slice(0, 10);
const DAY_MS = 86_400_000;

export const dateOf = (d: number): Date => new Date(BASE_UTC + d * DAY_MS);
export const isoOf = (d: number): string => dateOf(d).toISOString().slice(0, 10);
export const indexOfIso = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - BASE_UTC) / DAY_MS);
};
/** 0 = Monday … 6 = Sunday for a day index. */
export const weekdayOf = (d: number): number => ((d % 7) + 7) % 7;
/** First day of the week containing day index `d`; `offset` is how far the week start is from Monday (0 Monday, 5 Saturday, 6 Sunday). */
export const weekStartOf = (d: number, offset = 0): number => d - ((weekdayOf(d) - offset + 7) % 7);

/** Offset from Monday for the "week starts on" setting. */
export const WEEK_START_OFFSET = { monday: 0, saturday: 5, sunday: 6 } as const;

export type ShiftType = "rec" | "int";

export interface Shift {
  id: string;
  d: number;
  /** Assigned employee name; null while unassigned. */
  emp: string | null;
  site: string;
  /** Minutes since midnight. */
  s: number;
  e: number;
  type: ShiftType;
  title: string;
}

export interface OpenIntervention {
  id: string;
  title: string;
  site: string;
  d: number;
  s: number;
  e: number;
}

export interface Planned {
  name: string;
  title: JobTitle;
  site: string;
}

/** Public holidays by day index. Empty until the holiday calendar is loaded from the API; the server reports holiday conflicts when publishing. */
export const HOLIDAYS: Record<number, string> = {};

/** Approved leave by employee name: day indexes. Refreshed from the leave requests (see `syncPlannerCalendar`). */
export const LEAVE_DAYS: Record<string, number[]> = {};

/** Rebuild `LEAVE_DAYS` and `HOLIDAYS` from approved leave and the holiday calendar. The planner re-reads them when leave changes. */
export function syncPlannerCalendar(requests: { name: string; from: string; to: string; status: string }[], holidays: Record<string, string>): void {
  for (const k of Object.keys(LEAVE_DAYS)) delete LEAVE_DAYS[k];
  for (const k of Object.keys(HOLIDAYS)) delete HOLIDAYS[Number(k)];
  for (const r of requests) {
    if (r.status !== "approved") continue;
    for (let d = indexOfIso(r.from); d <= indexOfIso(r.to); d++) (LEAVE_DAYS[r.name] ??= []).push(d);
  }
  for (const [iso, name] of Object.entries(holidays)) HOLIDAYS[indexOfIso(iso)] = name;
}

/** Someone who can be planned: derived from the employees list. */
export const plannedFrom = (employees: { name: string; title: JobTitle; siteIds: string[]; status: string }[]): Planned[] =>
  employees.filter((e) => e.status !== "deactivated" && e.siteIds.length > 0).map((e) => ({ name: e.name, title: e.title, site: e.siteIds[0] }));

/** Saved groups of employees. The API has none yet. */
export const GROUPS: Record<string, string[]> = {};

/** Day-view timeline: 06:00–21:00 at 56px per hour. */
export const PX_PER_HOUR = 56;
export const DAY_START = 360;
export const DAY_END = 1260;
export const TRACK_WIDTH = ((DAY_END - DAY_START) / 60) * PX_PER_HOUR;

export function initialShifts(): Shift[] {
  return [];
}

export const INITIAL_INTERVENTIONS: OpenIntervention[] = [];

export type Conflict = { kind: "leave"; emp: string } | { kind: "overlap"; site: string; from: number; to: number };

/** Leave and double-booking conflicts for every assigned shift. */
export function findConflicts(shifts: Shift[]): Record<string, Conflict> {
  const out: Record<string, Conflict> = {};
  const byDay = new Map<string, Shift[]>();
  shifts.forEach((x) => { if (x.emp) { const k = `${x.emp}|${x.d}`; byDay.set(k, [...(byDay.get(k) ?? []), x]); } });
  for (const x of shifts) {
    if (!x.emp) continue;
    if ((LEAVE_DAYS[x.emp] ?? []).includes(x.d)) { out[x.id] = { kind: "leave", emp: x.emp.split(" ")[0] }; continue; }
    const other = byDay.get(`${x.emp}|${x.d}`)?.find((y) => y.id !== x.id && x.s < y.e && y.s < x.e);
    if (other) out[x.id] = { kind: "overlap", site: other.site, from: other.s, to: other.e };
  }
  return out;
}

export interface Filters {
  branch: string;
  site: string;
  emp: string;
  type: "all" | ShiftType;
}
export const DEFAULT_FILTERS: Filters = { branch: "all", site: "all", emp: "all", type: "all" };

