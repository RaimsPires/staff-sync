import { LEAVE_DAYS } from "@/features/schedules/model";
import { parseTime } from "@/lib/time";
import type { AttendanceRecord } from "@/types/domain";
import type { JobTitle, Employee } from "@/types/employee";
import type { ManagedSite } from "@/types/site";

export type RosterStatus = "in" | "late" | "out" | "absent" | "expected" | "flagged";

export interface RosterEntry {
  id: string;
  name: string;
  title: JobTitle;
  /** Shift start and end, minutes since midnight. */
  shiftStart: number;
  shiftEnd: number;
  status: RosterStatus;
  inMin: number | null;
  outMin: number | null;
  method: "app" | "qr" | "proxy";
  proxyBy?: string;
  /** Bearing in radians and distance as a fraction of the geofence radius (the map shows people around the site, not exact positions). */
  angle: number;
  distance: number;
}

/** Minutes since midnight now, on this device's clock. */
export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Today's board for one site, from the live attendance records. */
export function rosterFor(site: ManagedSite, today: AttendanceRecord[], employees: Employee[]): RosterEntry[] {
  const radius = site.geofence.kind === "circle" ? site.geofence.radius : 0;
  return today
    .filter((r) => r.site === site.id && r.status !== "holiday")
    .map((r): RosterEntry => {
      const [s, e] = r.sched.split("–");
      const flagged = !!r.flag && !r.cleared;
      const status: RosterStatus = flagged ? "flagged" : r.out ? "out" : r.in ? (r.status === "late" ? "late" : "in") : r.status === "absent" ? "absent" : r.status === "leave" ? "out" : "expected";
      const meters = parseFloat(r.dist ?? "");
      return {
        id: String(r.id), name: r.name, title: employees.find((x) => x.name === r.name)?.title ?? "technician", shiftStart: parseTime(s ?? "0:0"), shiftEnd: parseTime(e ?? "0:0"), status,
        inMin: r.in ? parseTime(r.in) : null, outMin: r.out ? parseTime(r.out) : null, method: r.method === "qr" ? "qr" : r.method === "behalf" || r.method === "admin" ? "proxy" : "app",
        proxyBy: r.proxyBy, angle: (((r.id * 47) % 360) * Math.PI) / 180, distance: flagged ? (radius && !Number.isNaN(meters) ? meters / radius : 1.4) : 0.3,
      };
    });
}

export interface HistoryRow {
  day: number;
  name: string;
  status: "in" | "late" | "absent" | "flagged";
  inMin: number | null;
  outMin: number | null;
}

/** Earlier days of this month at one site, newest first. */
export function historyFor(site: ManagedSite, history: AttendanceRecord[]): HistoryRow[] {
  return history
    .filter((r) => r.site === site.id && r.date !== undefined && r.status !== "holiday" && r.status !== "leave")
    .map((r): HistoryRow => ({
      day: r.date!, name: r.name, status: r.flag && !r.cleared ? "flagged" : r.status === "absent" ? "absent" : r.status === "late" ? "late" : "in",
      inMin: r.in ? parseTime(r.in) : null, outMin: r.out ? parseTime(r.out) : null,
    }))
    .sort((a, b) => b.day - a.day);
}

export interface WeekCell {
  kind: "shift" | "off" | "leave" | "half";
  from?: string;
  to?: string;
}

/** One row per team member for the week starting at day index `monday`, from the planner's shifts and approved leave. */
export function weekFor(team: { name: string }[], shifts: { emp: string | null; d: number; s: number; e: number }[], monday: number): { name: string; cells: WeekCell[] }[] {
  const hh = (m: number) => String(Math.floor(m / 60)).padStart(2, "0");
  return team.slice(0, 12).map((m) => ({
    name: m.name,
    cells: Array.from({ length: 7 }, (_, i): WeekCell => {
      const d = monday + i;
      const shift = shifts.filter((x) => x.emp === m.name && x.d === d).sort((a, b) => a.s - b.s)[0];
      if (shift) return { kind: shift.e - shift.s <= 300 ? "half" : "shift", from: hh(shift.s), to: hh(shift.e) };
      return (LEAVE_DAYS[m.name] ?? []).includes(d) ? { kind: "leave" } : { kind: "off" };
    }),
  }));
}
