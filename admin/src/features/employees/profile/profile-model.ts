import { DEMO_MONTH, DEMO_YEAR } from "@/data/live";

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

/** Monday = 0 … Sunday = 6, for a day of the current month. */
export const weekdayIndex = (day: number): number => (new Date(DEMO_YEAR, DEMO_MONTH, day).getDay() + 6) % 7;
export const isWeekend = (day: number): boolean => weekdayIndex(day) >= 5;
export const daysInMonth = (): number => new Date(DEMO_YEAR, DEMO_MONTH + 1, 0).getDate();

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
