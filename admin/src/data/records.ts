import type { AttendanceRecord, JobKey, RecordStatus, ScheduleKind } from "@/types/domain";
import { formatDuration, formatTime, parseTime } from "@/lib/time";

type Seed = [
  id: number, name: string, job: JobKey, site: string, sched: string, kind: ScheduleKind,
  in_: string, out: string, worked: string, status: RecordStatus, method: AttendanceRecord["method"],
  extra?: Partial<AttendanceRecord>,
];

const SEEDS: Seed[] = [
  [1, "Camille Durand", "electrician", "pd", "08:00–17:00", "recurring", "07:54", "", "2h 48m", "ontime", "app"],
  [2, "Yanis Benali", "carpenter", "pd", "08:00–17:00", "recurring", "08:21", "", "2h 21m", "late", "app", { lateBy: 21 }],
  [3, "Thomas Lefèvre", "plumber", "pd", "08:00–17:00", "recurring", "", "", "", "absent", ""],
  [4, "Manon Roux", "cleaningAgent", "pd", "06:00–10:00", "recurring", "05:50", "10:38", "4h 48m", "overtime", "app"],
  [5, "Léa Moreau", "forkliftOperator", "cf", "07:00–15:00", "recurring", "06:58", "", "3h 44m", "ontime", "app"],
  [6, "Hugo Martin", "nightGuard", "cf", "22:00–06:00", "recurringN", "21:55", "", "—", "missing", "app"],
  [7, "Jules Fontaine", "warehouseClerk", "cf", "11:00–19:00", "recurring", "", "", "", "scheduled", ""],
  [8, "Mehdi Haddad", "logisticsAgent", "sd", "08:00–17:00", "recurring", "08:03", "", "2h 39m", "flagged", "app", { flag: "dist", dist: "412 m" }],
  [9, "Amina Diallo", "orderPicker", "sd", "08:00–17:00", "recurring", "07:49", "", "2h 53m", "ontime", "behalf"],
  [10, "Karim Saïdi", "orderPicker", "sd", "08:00–17:00", "recurring", "08:06", "", "2h 36m", "flagged", "app", { flag: "mock" }],
  [11, "Sofia Rossi", "dockSupervisor", "rl", "06:00–14:00", "recurring", "05:57", "", "4h 45m", "ontime", "app"],
  [12, "Lucas Bernard", "driver", "rl", "06:00–14:00", "recurring", "06:12", "", "4h 30m", "late", "app", { lateBy: 12 }],
  [13, "Inès Garcia", "craneOperator", "pv", "08:00–17:00", "recurring", "", "", "", "leave", ""],
  [14, "Chloé Petit", "safetyInspector", "pv", "07:00–11:00", "intervention", "06:55", "10:20", "3h 25m", "early", "app"],
  [15, "Rémi Lambert", "rigger", "pv", "08:00–17:00", "recurring", "", "", "", "absent", ""],
  [16, "Élodie Marchand", "warehouseClerk", "cf", "11:00–19:00", "recurring", "", "", "", "scheduled", ""],
  [17, "Nathan Petit", "orderPicker", "sd", "11:00–19:00", "recurring", "", "", "", "scheduled", ""],
  [18, "Omar Benali", "driver", "rl", "11:00–19:00", "recurring", "", "", "", "scheduled", ""],
  [19, "Théo Garnier", "rigger", "pv", "10:30–18:30", "recurring", "", "", "", "scheduled", ""],
  [20, "Sarah Lemoine", "cleaningAgent", "sd", "06:00–10:00", "recurring", "05:58", "10:02", "4h 04m", "ontime", "app"],
  [21, "Bastien Leroy", "siteTechnician", "pd", "07:00–10:30", "intervention", "06:55", "10:31", "3h 36m", "ontime", "app"],
  [22, "Lina Chevalier", "dockAgent", "rl", "09:00–17:00", "recurring", "08:57", "", "1h 45m", "ontime", "app"],
];

/** Today's attendance records (Thursday 15 October 2026). */
export const RECORDS: AttendanceRecord[] = SEEDS.map(([id, name, job, site, sched, kind, in_, out, worked, status, method, extra]) => ({
  id, emp: id, name, job, site, sched, kind, in: in_, out, worked, status, method, ...extra,
}));

/** Records whose employees also have a history for the sample month. */
const WORKDAYS = [1, 2, 5, 6, 7, 8, 9, 12, 13, 14];

/**
 * Deterministic sample history for 1–14 Oct 2026, one row per employee and workday.
 * Replace with the attendance API; the shape is the same as today's records plus `date`.
 */
function buildHistory(): AttendanceRecord[] {
  const out: AttendanceRecord[] = [];
  for (const d of WORKDAYS) {
    for (const base of RECORDS) {
      const r = (base.id * 31 + d * 17 + ((base.id * d) % 7)) % 100;
      const [s0, e0] = base.sched.split("–");
      const status: RecordStatus =
        r < 60 ? "ontime" : r < 72 ? "late" : r < 77 ? "early" : r < 82 ? "absent" : r < 86 ? "missing" : r < 92 ? "overtime" : r < 96 ? "leave" : "flagged";
      let checkIn = "";
      let checkOut = "";
      if (status === "ontime" || status === "flagged") {
        checkIn = formatTime(parseTime(s0) - (r % 9) - 1);
        checkOut = formatTime(parseTime(e0) + (r % 6));
      } else if (status === "late") {
        checkIn = formatTime(parseTime(s0) + 6 + (r % 25));
        checkOut = formatTime(parseTime(e0) + (r % 4));
      } else if (status === "early") {
        checkIn = formatTime(parseTime(s0) - (r % 5) - 1);
        checkOut = formatTime(parseTime(e0) - 20 - (r % 40));
      } else if (status === "overtime") {
        checkIn = formatTime(parseTime(s0) - (r % 7) - 1);
        checkOut = formatTime(parseTime(e0) + 25 + (r % 40));
      } else if (status === "missing") {
        checkIn = formatTime(parseTime(s0) - (r % 6) - 1);
      }
      const edit =
        status === "missing" && r % 2
          ? { by: "Nadia Koné", at: `${d} Oct 18:05` }
          : checkIn && r % 17 === 0
            ? { by: "Claire Vasseur", at: `${d} Oct 17:40` }
            : status === "absent" && r % 3 === 0
              ? { by: "Marc Olivier", at: `${d} Oct 09:20` }
              : null;
      const method =
        base.id === 9 || (checkIn && r % 11 === 0) ? "behalf" : checkIn && r % 7 === 0 ? "qr" : checkIn ? "app" : "";
      out.push({
        ...base,
        id: 1000 + d * 100 + base.id,
        emp: base.id,
        date: d,
        in: checkIn,
        out: checkOut,
        worked: checkIn && checkOut ? formatDuration(checkIn, checkOut) : "",
        status,
        method: edit?.by === "Claire Vasseur" && r % 2 ? "admin" : method,
        flag: status === "flagged" ? (r % 2 ? "dist" : "mock") : undefined,
        dist: status === "flagged" ? `${160 + r * 3} m` : undefined,
        lateBy: status === "late" ? 6 + (r % 25) : undefined,
        offline: !!checkIn && r % 13 === 0,
        edit,
        cleared: false,
        fraud: false,
        proxyBy: undefined,
      });
    }
  }
  return out;
}

export const HISTORY: AttendanceRecord[] = buildHistory();
