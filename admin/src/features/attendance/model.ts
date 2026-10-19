import { QR_RECORD_IDS, DEMO_TODAY } from "@/data/live";
import { branchOfSite, siteById } from "@/data/org";
import { parseTime } from "@/lib/time";
import type { AttendanceRecord, RecordStatus } from "@/types/domain";

export type Method = "app" | "proxy" | "qr" | "admin" | "";

/** Today's records are tagged with the sample day so they sort and filter with the history. */
export const withDate = (r: AttendanceRecord): AttendanceRecord => ({ ...r, date: r.date ?? DEMO_TODAY, emp: r.emp || r.id });

export const employeeCode = (r: Pick<AttendanceRecord, "emp" | "id">): string => `EMP-${String(100 + (r.emp || r.id) * 7).padStart(4, "0")}`;

export const isFlagged = (r: AttendanceRecord): boolean => !!r.flag && !r.cleared;

/** Status used in tables and filters: confirmed fraud counts as flagged. */
export const statusOf = (r: AttendanceRecord): RecordStatus => (r.fraud ? "flagged" : r.status);

export function methodOf(r: AttendanceRecord): Method {
  if (r.method === "behalf") return "proxy";
  if (r.method === "qr" || (r.method === "app" && r.date === DEMO_TODAY && QR_RECORD_IDS.includes(r.id))) return "qr";
  return r.method;
}

export type RangeKey = "today" | "yesterday" | "7d" | "month" | "custom";

export interface Filters {
  range: RangeKey;
  /** Custom range bounds, days of the sample month. */
  from: number;
  to: number;
  branch: string;
  site: string;
  employee: string;
  statuses: RecordStatus[];
  method: "all" | Exclude<Method, "">;
  flaggedOnly: boolean;
  offlineOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  range: "7d", from: 9, to: DEMO_TODAY, branch: "all", site: "all", employee: "", statuses: [], method: "all",
  flaggedOnly: false, offlineOnly: false,
};

export const RANGE_DAYS: Record<Exclude<RangeKey, "custom">, [number, number]> = {
  today: [15, 15],
  yesterday: [14, 14],
  "7d": [9, 15],
  month: [1, 15],
};

export const rangeOf = (f: Filters): [number, number] =>
  f.range === "custom" ? [Math.min(f.from, f.to), Math.max(f.from, f.to)] : RANGE_DAYS[f.range];

export const activeFilterCount = (f: Filters): number =>
  (f.range !== "7d" ? 1 : 0) + (f.branch !== "all" ? 1 : 0) + (f.site !== "all" ? 1 : 0) + (f.employee.trim() ? 1 : 0) +
  (f.statuses.length ? 1 : 0) + (f.method !== "all" ? 1 : 0) + (f.flaggedOnly ? 1 : 0) + (f.offlineOnly ? 1 : 0);

/** Everything except the status filter, so status counts can show what each option would add. */
export function applyBaseFilters(records: AttendanceRecord[], f: Filters, accessibleSites: string[]): AttendanceRecord[] {
  const [from, to] = rangeOf(f);
  const q = f.employee.trim().toLowerCase();
  return records.filter(
    (r) =>
      accessibleSites.includes(r.site) &&
      (r.date ?? DEMO_TODAY) >= from && (r.date ?? DEMO_TODAY) <= to &&
      (f.branch === "all" || branchOfSite(r.site).id === f.branch) &&
      (f.site === "all" || r.site === f.site) &&
      (!q || r.name.toLowerCase().includes(q) || employeeCode(r).toLowerCase().includes(q)) &&
      (f.method === "all" || methodOf(r) === f.method) &&
      (!f.flaggedOnly || isFlagged(r)) &&
      (!f.offlineOnly || r.offline),
  );
}

export const applyFilters = (records: AttendanceRecord[], f: Filters, accessibleSites: string[]): AttendanceRecord[] => {
  const base = applyBaseFilters(records, f, accessibleSites);
  return f.statuses.length ? base.filter((r) => f.statuses.includes(statusOf(r))) : base;
};

export type SortKey = "date" | "employee" | "site" | "in" | "out" | "worked" | "status" | "edited";
export interface Sort {
  key: SortKey;
  dir: "asc" | "desc";
}

const workedMinutes = (r: AttendanceRecord): number => {
  const m = r.worked.match(/(\d+)h\s*(\d+)?/);
  return !r.worked ? -1 : m ? Number(m[1]) * 60 + Number(m[2] ?? 0) : 0;
};
const timeKey = (t: string) => (t ? t : "99:99");

const sortValue: Record<SortKey, (r: AttendanceRecord) => string | number> = {
  date: (r) => (r.date ?? DEMO_TODAY) * 10_000 + (r.in ? Number(r.in.replace(":", "")) : 0),
  employee: (r) => r.name,
  site: (r) => siteById(r.site).name,
  in: (r) => timeKey(r.in),
  out: (r) => timeKey(r.out),
  worked: workedMinutes,
  status: statusOf,
  edited: (r) => r.edit?.at ?? "",
};

export function sortRecords(records: AttendanceRecord[], sort: Sort): AttendanceRecord[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  const value = sortValue[sort.key];
  return [...records].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    return (x < y ? -1 : x > y ? 1 : 0) * dir || (b.date ?? 0) - (a.date ?? 0) || a.name.localeCompare(b.name);
  });
}

/** Parses "08:00–17:00" into [start, end] minutes. */
export const scheduleMinutes = (sched: string): [number, number] => {
  const [s, e] = sched.split("–");
  return [parseTime(s), parseTime(e)];
};

export const newManualId = (existing: AttendanceRecord[]): number =>
  Math.max(5000, ...existing.filter((r) => r.id >= 5000).map((r) => r.id + 1));
