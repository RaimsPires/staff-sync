import { useMemo } from "react";
import { parseTime } from "@/lib/time";
import { DEFAULT_SETTINGS } from "@/data/settings";
import { useSettings } from "@/store/settings";
import type { AttendanceRecord } from "@/types/domain";

/** The punctuality rules from Settings → Attendance rules. */
export interface AttendanceRules {
  /** Minutes after the shift start before an arrival counts as late. */
  grace: number;
  /** Minutes before the shift end that still count as a normal departure. */
  early: number;
  /** What happens to a shift with an arrival but no departure. */
  miss: "flag" | "auto" | "ignore";
  /** Time a missing departure is closed at when `miss` is "auto". */
  autoOut: string;
}

export const DEFAULT_RULES: AttendanceRules = {
  grace: DEFAULT_SETTINGS.grace, early: DEFAULT_SETTINGS.early, miss: DEFAULT_SETTINGS.miss, autoOut: DEFAULT_SETTINGS.autoOut,
};

/** Minutes between a leave time and the scheduled end, or null when it can't be told (no data, overnight). */
function earlyBy(r: AttendanceRecord): number | null {
  const [start, end] = r.sched.split("–");
  if (!r.out || !start || !end) return null;
  const s = parseTime(start);
  const e = parseTime(end);
  if (e <= s) return null;
  return e - parseTime(r.out);
}

/**
 * Re-evaluates the punctuality status of a record against the current rules, so changing the
 * grace period in Settings changes who is "late". Flagged, missing, absent and leave records
 * keep the status they were given.
 */
export function applyRules(r: AttendanceRecord, rules: AttendanceRules): AttendanceRecord {
  if (r.status === "missing" && !r.fraud && rules.miss !== "flag") {
    // "auto" closes the shift at the configured time; "ignore" leaves it as a normal day without a departure.
    return { ...r, status: "ontime", ...(rules.miss === "auto" ? { out: rules.autoOut } : {}) };
  }
  if (r.fraud || (r.flag && !r.cleared)) return r;
  if (r.status !== "ontime" && r.status !== "late" && r.status !== "early") return r;
  let status = r.status;
  if (r.lateBy !== undefined) status = r.lateBy > rules.grace ? "late" : r.status === "late" ? "ontime" : r.status;
  const gap = earlyBy(r);
  if (gap !== null && status !== "late") status = gap > rules.early ? "early" : status === "early" ? "ontime" : status;
  return status === r.status ? r : { ...r, status };
}

export function useAttendanceRules(): AttendanceRules {
  const grace = useSettings((s) => s.values.grace);
  const early = useSettings((s) => s.values.early);
  const miss = useSettings((s) => s.values.miss);
  const autoOut = useSettings((s) => s.values.autoOut);
  return useMemo(() => ({ grace, early, miss, autoOut }), [grace, early, miss, autoOut]);
}

/** Records re-evaluated against the current rules; the same array while neither changes. */
export function useRuledRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const rules = useAttendanceRules();
  return useMemo(() => records.map((r) => applyRules(r, rules)), [records, rules]);
}

