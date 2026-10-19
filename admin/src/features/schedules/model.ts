import { parseTime } from "@/lib/time";
import type { JobTitle } from "@/types/employee";

/** Day 0 is Monday 12 October 2026; "today" (Thu 15 Oct) is day 3. */
export const BASE_UTC = Date.UTC(2026, 9, 12);
export const TODAY_INDEX = 3;
const DAY_MS = 86_400_000;

export const dateOf = (d: number): Date => new Date(BASE_UTC + d * DAY_MS);
export const isoOf = (d: number): string => dateOf(d).toISOString().slice(0, 10);
export const indexOfIso = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - BASE_UTC) / DAY_MS);
};
/** 0 = Monday … 6 = Sunday for a day index. */
export const weekdayOf = (d: number): number => ((d % 7) + 7) % 7;
export const mondayOf = (d: number): number => Math.floor(d / 7) * 7;

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

export const HOLIDAYS: Record<number, "allSaints" | "armistice"> = { 20: "allSaints", 30: "armistice" };

/** Approved leave by employee: day indexes. */
export const LEAVE_DAYS: Record<string, number[]> = {
  "Karim Benali": [15, 16], "Léa Moreau": [14], "Hugo Petit": [17, 18], "Nora Diallo": [22, 23], "Sofia Rossi": [8],
};

export const PLANNED: Planned[] = [
  { name: "Amélie Fontaine", title: "machinist", site: "sd" }, { name: "Karim Benali", title: "forkliftOperator", site: "rl" },
  { name: "Léa Moreau", title: "cleaner", site: "pd" }, { name: "Thomas Girard", title: "technician", site: "cf" },
  { name: "Inès Haddad", title: "electrician", site: "pv" }, { name: "Paul Lambert", title: "driver", site: "sd" },
  { name: "Sofia Rossi", title: "loader", site: "rl" }, { name: "Hugo Petit", title: "machinist", site: "sd" },
  { name: "Nora Diallo", title: "inspector", site: "cf" }, { name: "Elena Marchand", title: "cleaner", site: "cf" },
];
export const plannedBy = (name: string): Planned | undefined => PLANNED.find((p) => p.name === name);

export const GROUPS: Record<string, string[]> = {
  "Saint-Denis day crew": ["Amélie Fontaine", "Paul Lambert", "Hugo Petit"],
  "Lyon cleaning team": ["Léa Moreau", "Elena Marchand"],
  "Logistics loaders": ["Karim Benali", "Sofia Rossi"],
  Technicians: ["Thomas Girard", "Inès Haddad", "Nora Diallo"],
};

/** Day-view timeline: 06:00–21:00 at 56px per hour. */
export const PX_PER_HOUR = 56;
export const DAY_START = 360;
export const DAY_END = 1260;
export const TRACK_WIDTH = ((DAY_END - DAY_START) / 60) * PX_PER_HOUR;

export function initialShifts(): Shift[] {
  const out: Shift[] = [];
  let n = 0;
  const add = (d: number, emp: string, site: string, s: number, e: number, type: ShiftType, title = "") => out.push({ id: `s${n++}`, d, emp, site, s, e, type, title });
  PLANNED.forEach((p, i) => {
    const days = i % 3 === 2 ? [0, 1, 3] : [0, 1, 2, 3, 4];
    const hours = i % 4 === 1 ? [600, 1080] : i % 4 === 3 ? [360, 840] : [480, 960];
    for (let d = -14; d <= 34; d++) {
      if (!days.includes(weekdayOf(d)) || HOLIDAYS[d]) continue;
      if ((LEAVE_DAYS[p.name] ?? []).includes(d) && d !== 16) continue;
      add(d, p.name, p.site, hours[0], hours[1], "rec");
    }
  });
  add(15, "Amélie Fontaine", "sd", 1020, 1200, "int", "Night prep");
  add(16, "Thomas Girard", "cf", 780, 1020, "int", "Chiller repair");
  add(17, "Inès Haddad", "pv", 1020, 1140, "int", "Evening crane check");
  add(9, "Paul Lambert", "sd", 1020, 1140, "int", "Fleet check");
  add(21, "Hugo Petit", "sd", 1020, 1140, "int", "Press maintenance");
  return out;
}

export const INITIAL_INTERVENTIONS: OpenIntervention[] = [
  { id: "u1", title: "Boiler failure", site: "pd", d: 14, s: 840, e: 1080 },
  { id: "u2", title: "Evening patrol", site: "sd", d: 15, s: 1080, e: 1380 },
  { id: "u3", title: "Dock inspection", site: "pv", d: 17, s: 540, e: 660 },
  { id: "u4", title: "Fire-door audit", site: "cf", d: 16, s: 600, e: 720 },
  { id: "u5", title: "Cargo scan", site: "rl", d: 18, s: 420, e: 600 },
];

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

export const minutesOf = parseTime;
