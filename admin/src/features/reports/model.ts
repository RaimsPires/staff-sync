import type { ExportKind, Frequency, GroupBy, RangeKey, ReportConfig, ReportType } from "@/types/reports";

export const DAY_MS = 864e5;
export type Unit = "h" | "d" | "n" | "min" | "%";
/** A report column: `key` is the server's column name. The totals row sums it (otherwise it averages). */
interface Col { key: string; unit: Unit; sum: boolean }
interface Spec { cols: Col[]; defaults: string[]; icon: string; /** Name the server knows the report by. */ server: string }

const n = (key: string): Col => ({ key, unit: "n", sum: true });
const h = (key: string): Col => ({ key, unit: "h", sum: true });

export const REPORTS: Record<ReportType, Spec> = {
  timesheet: { server: "timesheet", icon: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", defaults: ["records", "hours", "overtime_hours"], cols: [n("records"), h("hours"), h("overtime_hours")] },
  hours: { server: "hours_worked", icon: "M4 20V10M10 20V4M16 20v-8M22 20H2", defaults: ["hours"], cols: [h("hours")] },
  lateness: { server: "lateness", icon: "M12 3v9l5 3M3 12a9 9 0 1 0 3-6.7L3 8", defaults: ["late_count", "late_minutes"], cols: [n("late_count"), { key: "late_minutes", unit: "min", sum: true }] },
  absences: { server: "absences", icon: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM18 8l4 4m0-4l-4 4", defaults: ["absent"], cols: [{ key: "absent", unit: "d", sum: true }] },
  overtime: { server: "overtime", icon: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM17 2l3 3", defaults: ["overtime_hours"], cols: [h("overtime_hours")] },
  flagged: { server: "flagged", icon: "M5 21V4M5 4h12l-2 4 2 4H5", defaults: ["flagged"], cols: [n("flagged")] },
  site: { server: "site_summary", icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6", defaults: ["records", "hours", "late_count", "absent", "flagged"], cols: [n("records"), h("hours"), n("late_count"), { key: "absent", unit: "d", sum: true }, n("flagged")] },
  proxy: { server: "proxy", icon: "M16 11a4 4 0 1 0-8 0M12 15c-4 0-7 2-7 5M17 14l2 2 3-3", defaults: ["proxy"], cols: [n("proxy")] },
};

export const CATEGORIES: { id: "time" | "sites"; types: ReportType[] }[] = [
  { id: "time", types: ["timesheet", "hours", "lateness", "absences", "overtime"] },
  { id: "sites", types: ["site", "flagged", "proxy"] },
];

const NOW = new Date();
const TODAY = Date.UTC(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const QUARTER = Math.floor(NOW.getMonth() / 3) * 3;

/** The preset ranges, worked out from today. */
export const RANGES: Record<Exclude<RangeKey, "custom">, { from: string; to: string }> = {
  month: { from: iso(Date.UTC(NOW.getFullYear(), NOW.getMonth(), 1)), to: iso(TODAY) },
  last: { from: iso(Date.UTC(NOW.getFullYear(), NOW.getMonth() - 1, 1)), to: iso(Date.UTC(NOW.getFullYear(), NOW.getMonth(), 0)) },
  "7": { from: iso(TODAY - 6 * DAY_MS), to: iso(TODAY) },
  q: { from: iso(Date.UTC(NOW.getFullYear(), QUARTER - 3, 1)), to: iso(Date.UTC(NOW.getFullYear(), QUARTER, 0)) },
};
export const RANGE_KEYS: RangeKey[] = ["month", "last", "7", "q", "custom"];
export const GROUPS: GroupBy[] = ["employee", "site", "branch", "day"];
export const FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly"];
export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const MONTH_DAYS = ["1", "5", "15", "last"] as const;
export const EXPORT_KINDS: ExportKind[] = ["csv", "xlsx", "pdf"];

export const parseDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };

export const defaultConfig = (type: ReportType): ReportConfig => ({
  type, range: "month", from: RANGES.month.from, to: RANGES.month.to, branches: [], sites: [], emps: [], group: "employee", cols: [...REPORTS[type].defaults],
});

export const rangeOf = (c: Pick<ReportConfig, "range" | "from" | "to">): [string, string] => (c.range === "custom" ? [c.from, c.to] : [RANGES[c.range].from, RANGES[c.range].to]);

export interface ReportData { rows: { key: string; vals: number[] }[]; cols: Col[]; days: number }

export const emptyReport = (c: ReportConfig): ReportData => ({ rows: [], cols: REPORTS[c.type].cols.filter((x) => c.cols.includes(x.key)), days: 0 });

export const formatValue = (v: number, unit: Unit) => (unit === "%" ? `${Math.round(v)}%` : String(Math.round(v * 10) / 10));
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** The next planned delivery of a schedule, counted from today. */
export function nextDelivery(s: { freq: Frequency; day: string }): { kind: "next"; iso: string } {
  const weekday = (TODAY_UTC_DAY + 6) % 7; // 0 = Monday
  const next =
    s.freq === "daily" ? TODAY + DAY_MS
    : s.freq === "weekly" ? TODAY + (((WEEKDAYS.indexOf(s.day as (typeof WEEKDAYS)[number]) - weekday + 7) % 7) || 7) * DAY_MS
    : Date.UTC(NOW.getFullYear(), NOW.getMonth() + 1, s.day === "last" ? 0 : Number(s.day) || 1) + (s.day === "last" ? DAY_MS * 0 : 0);
  return { kind: "next", iso: iso(s.day === "last" && s.freq === "monthly" ? Date.UTC(NOW.getFullYear(), NOW.getMonth() + 2, 0) : next) };
}
const TODAY_UTC_DAY = new Date(TODAY).getUTCDay();
