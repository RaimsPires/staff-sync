import { DEMO_TODAY } from "@/data/live";
import type { Employee } from "@/types/employee";

export type DayStatus = "present" | "late" | "absent" | "leave";

export interface DayRecord {
  day: number;
  weekend?: boolean;
  future?: boolean;
  today?: boolean;
  status?: DayStatus;
  /** Minutes since midnight. */
  inMin?: number | null;
  outMin?: number | null;
}

const hash = (s: string): number => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
export const hashOf = hash;

const rngOf = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** 1 Oct 2026 is a Thursday, so day 3 and 4 are the first weekend. */
export const isWeekend = (day: number): boolean => {
  const w = (day + 3) % 7;
  return w === 0 || w === 6;
};
/** Monday = 0 … Sunday = 6. */
export const weekdayIndex = (day: number): number => (day + 2) % 7;

/** Deterministic attendance for the sample month; swap for the attendance API. */
export function monthRecords(emp: Employee): DayRecord[] {
  const R = rngOf(hash(emp.id));
  const none = emp.app === "invited" && emp.attendance === 0;
  const out: DayRecord[] = [];
  for (let day = 1; day <= 31; day++) {
    if (isWeekend(day)) { out.push({ day, weekend: true }); continue; }
    if (day > DEMO_TODAY || none) { out.push({ day, future: true }); continue; }
    if (day === DEMO_TODAY) { out.push({ day, status: "present", inMin: 478, outMin: null, today: true }); continue; }
    const x = R();
    let inMin: number | null = 480 - Math.round(R() * 12) + 4;
    let outMin: number | null = 960 + Math.round(R() * 22 - 6);
    let status: DayStatus;
    if (x < emp.attendance / 100) {
      if (R() < 0.16) { status = "late"; inMin = 480 + 8 + Math.round(R() * 30); } else status = "present";
    } else if (R() < 0.4) { status = "leave"; inMin = outMin = null; } else { status = "absent"; inMin = outMin = null; }
    out.push({ day, status, inMin, outMin });
  }
  return out;
}

export interface MonthStats {
  rate: number;
  lates: number;
  absences: number;
  hours: number;
  overtime: number;
  planned: number;
  hasData: boolean;
}

export function monthStats(records: DayRecord[]): MonthStats {
  const past = records.filter((r) => r.status && !r.today);
  const worked = past.filter((r) => r.status === "present" || r.status === "late");
  let hours = 0;
  let overtime = 0;
  for (const r of worked) {
    const h = ((r.outMin ?? 0) - (r.inMin ?? 0)) / 60;
    hours += h;
    overtime += Math.max(0, h - 8);
  }
  return {
    rate: past.length ? Math.round((worked.length / past.length) * 100) : 0,
    lates: past.filter((r) => r.status === "late").length,
    absences: past.filter((r) => r.status === "absent").length,
    hours, overtime, planned: past.length * 8, hasData: records.some((r) => r.status),
  };
}

export const minutesLabel = (m: number): string => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;
export const round1 = (n: number): string => String(Math.round(n * 10) / 10);

export interface RecurringSchedule {
  id: number;
  /** 0 = Monday … 6 = Sunday */
  days: number[];
  start: string;
  end: string;
  site: string;
}

export const defaultSchedules = (emp: Employee): RecurringSchedule[] => [
  { id: 1, days: [0, 1, 2, 3, 4], start: "08:00", end: "16:00", site: emp.siteIds[0] ?? "pd" },
  ...(emp.siteIds[1] ? [{ id: 2, days: [5], start: "08:00", end: "12:00", site: emp.siteIds[1] }] : []),
];

/** Days already taken this year, per leave type id (sample data; types added in Settings start at 0). */
export const LEAVE_USED: Record<string, number> = { annual: 15, rtt: 1, sick: 1, family: 0 };
/** Id of a leave type defined in Settings. */
export type LeaveKey = string;

export interface LeaveRow {
  type: LeaveKey;
  from: string;
  to: string;
  days: number;
  status: "approved" | "pending" | "rejected";
}
export const LEAVE_HISTORY: LeaveRow[] = [
  { type: "annual", from: "2026-10-27", to: "2026-10-31", days: 5, status: "pending" },
  { type: "sick", from: "2026-09-12", to: "2026-09-12", days: 1, status: "approved" },
  { type: "rtt", from: "2026-08-14", to: "2026-08-14", days: 1, status: "approved" },
  { type: "annual", from: "2026-07-21", to: "2026-08-01", days: 10, status: "approved" },
  { type: "family", from: "2026-03-03", to: "2026-03-03", days: 1, status: "rejected" },
];

export const DEVICES = ["iPhone 14", "Pixel 7", "Galaxy A54", "iPhone 12"];
