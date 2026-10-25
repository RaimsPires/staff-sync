import type { AttendanceRecord } from "@/types/domain";

/** Where an employee is right now, independent of the day's final status. */
export type Presence = "not" | "present" | "left" | "absent" | "leave";

export const presenceOf = (r: AttendanceRecord): Presence =>
  r.status === "leave" ? "leave" : r.status === "absent" ? "absent" : r.out ? "left" : r.in ? "present" : "not";

export const isFlagged = (r: AttendanceRecord): boolean => !!r.flag && !r.cleared;

export type BoardMethod = "app" | "proxy" | "qr" | "admin" | "";

export const methodOf = (r: AttendanceRecord): BoardMethod =>
  r.method === "behalf" ? "proxy" : r.method;

/** Display order inside a site: waiting first, people on leave last. */
export const PRESENCE_ORDER: Record<Presence, number> = { not: 0, present: 1, absent: 2, left: 3, leave: 4 };

/** Deterministic distance from the site centre for check-ins that were not flagged. */
export function distanceLabel(r: AttendanceRecord): string {
  if (!r.in) return "—";
  if (r.flag === "dist") return r.dist ?? "?";
  if (r.flag === "mock") return "?";
  return `${((r.id * 37) % 40) + 6} m`;
}

export type StatusFilter = "all" | Presence | "flagged";
export type CounterKey = "expected" | Presence;

export const countFor = (rows: AttendanceRecord[], key: CounterKey): number =>
  rows.filter((r) => (key === "expected" ? r.status !== "leave" : presenceOf(r) === key)).length;

export const matchesFilter = (r: AttendanceRecord, filter: StatusFilter): boolean =>
  filter === "all" || (filter === "flagged" ? isFlagged(r) : presenceOf(r) === filter);
