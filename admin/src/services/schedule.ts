import { api } from "@/lib/api";
import { formatTime, parseTime } from "@/lib/time";
import { instantOn } from "@/services/attendance";
import { employeeUuidByName } from "@/services/org";
import { scheduleRemote, useSchedule } from "@/store/schedule";
import { useSites } from "@/store/sites";
import { indexOfIso, isoOf, weekdayOf, type OpenIntervention, type Shift } from "@/features/schedules/model";

interface ApiShift {
  id: string;
  employee_id: string;
  employee_name: string | null;
  site_id: string;
  schedule_id: string;
  title: string | null;
  is_intervention: boolean;
  starts_at: string;
  ends_at: string;
  status: string;
}

interface ApiSchedule {
  id: string;
  type: "recurring" | "intervention";
  site_id: string;
  title: string;
  start_time: string;
  end_time: string;
  valid_from: string;
  status: string;
  employee_ids: string[];
}

/** What the server knows about a planner shift beyond what the planner shows. */
interface ShiftMeta {
  scheduleId: string;
  draft: boolean;
  /** Ends on a later day than it starts; the planner shows it cut at midnight. */
  overnight: boolean;
  durationMs: number;
}
const meta = new Map<string, ShiftMeta>();

const zoneOf = (siteId: string) => useSites.getState().sites.find((s) => s.id === siteId)?.timezone ?? "UTC";
const localDate = (iso: string, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));
const localMinutes = (iso: string, tz: string) => {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date(iso)).split(":").map(Number);
  return (h % 24) * 60 + m;
};
const hhmm = (minutes: number) => formatTime(minutes);

function toShift(a: ApiShift, names: Map<string, string>): Shift {
  const tz = zoneOf(a.site_id);
  const startDate = localDate(a.starts_at, tz);
  const overnight = localDate(a.ends_at, tz) !== startDate;
  meta.set(a.id, { scheduleId: a.schedule_id, draft: a.status === "draft", overnight, durationMs: Date.parse(a.ends_at) - Date.parse(a.starts_at) });
  return {
    id: a.id, d: indexOfIso(startDate), emp: a.employee_name ?? names.get(a.employee_id) ?? null, site: a.site_id, s: localMinutes(a.starts_at, tz),
    e: overnight ? 1439 : localMinutes(a.ends_at, tz), type: a.is_intervention ? "int" : "rec", title: a.title && a.is_intervention ? a.title : "",
  };
}

/** Read the planner window (two weeks back, five ahead) and the interventions still waiting for someone. */
export async function loadSchedule(): Promise<void> {
  const from = `${isoOf(-14)}T00:00:00Z`;
  const to = `${isoOf(35)}T00:00:00Z`;
  const [shifts, schedules] = await Promise.all([
    api.get<ApiShift[]>("/shifts", { params: { from, to } }),
    api.get<ApiSchedule[]>("/schedules", { params: { type: "intervention" } }),
  ]);
  meta.clear();
  const names = new Map<string, string>();
  const mapped = shifts.map((x) => toShift(x, names));
  const dirty = Object.fromEntries(mapped.filter((x) => meta.get(x.id)?.draft).map((x) => [x.id, true as const]));
  const interventions: OpenIntervention[] = schedules
    .filter((s) => s.employee_ids.length === 0)
    .map((s) => ({ id: s.id, title: s.title, site: s.site_id, d: indexOfIso(s.valid_from), s: parseTime(s.start_time), e: parseTime(s.end_time) }));
  useSchedule.setState({ shifts: mapped, dirty, interventions, deleted: 0 });
}

const need = (name: string): string => {
  const id = employeeUuidByName(name);
  if (!id) throw new Error(`Unknown employee ${name}`);
  return id;
};

/** A one-off schedule for a single planner row. Recurring one-offs are real shifts; interventions are flagged as such. */
function oneOffBody(row: Omit<Shift, "id">) {
  const date = isoOf(row.d);
  return {
    type: row.type === "int" ? "intervention" : "recurring",
    site_id: row.site,
    title: row.title || (row.type === "int" ? "Intervention" : "Shift"),
    days_of_week: [weekdayOf(row.d)],
    start_time: hhmm(row.s),
    end_time: hhmm(row.e),
    crosses_midnight: row.e <= row.s,
    valid_from: date,
    valid_to: date,
    employee_ids: row.emp ? [need(row.emp)] : [],
  };
}

export interface ScheduleForm {
  kind: "rec" | "int";
  title: string;
  site: string;
  employees: string[];
  days: number[];
  start: string;
  end: string;
  crossesMidnight: boolean;
  breakMin: number;
  graceMin: number;
  earlyMin: number;
  startDate: string;
  endDate: string | null;
  rotation: { weeksA: number; weeksB: number; bStart: string; bEnd: string } | null;
  date: string;
  instructions: string;
  priority: "low" | "normal" | "high";
}

/** Create a schedule from the "New schedule" form and, when asked, publish it. Resolves with the number of planner shifts it produced. */
export async function createSchedule(f: ScheduleForm, publish: boolean, notify: boolean): Promise<number> {
  const rec = f.kind === "rec";
  const body = {
    type: rec ? "recurring" : "intervention",
    site_id: f.site,
    title: f.title,
    days_of_week: rec ? f.days : [],
    start_time: f.start,
    end_time: f.end,
    crosses_midnight: rec && f.crossesMidnight,
    break_min: f.breakMin,
    grace_min: f.graceMin,
    early_leave_tol_min: f.earlyMin,
    valid_from: rec ? f.startDate : f.date,
    valid_to: rec ? f.endDate : f.date,
    rotation: rec && f.rotation
      ? { pattern: [{ weeks: f.rotation.weeksA, start: f.start, end: f.end, crosses_midnight: f.crossesMidnight }, { weeks: f.rotation.weeksB, start: f.rotation.bStart, end: f.rotation.bEnd, crosses_midnight: parseTime(f.rotation.bEnd) <= parseTime(f.rotation.bStart) }] }
      : null,
    instructions: f.instructions || null,
    priority: rec ? null : f.priority,
    employee_ids: f.employees.map(need),
  };
  const created = await api.post<{ id: string }>("/schedules", body);
  if (publish) await api.post("/schedules/publish", { schedule_ids: [created.id], notify, confirm_conflicts: true });
  await loadSchedule();
  return useSchedule.getState().shifts.filter((x) => meta.get(x.id)?.scheduleId === created.id).length;
}

/** Copy last week's shifts onto this one. Resolves with how many were added. */
export async function copyWeek(fromDay: number, toDay: number, siteId?: string): Promise<number> {
  const out = await api.post<{ copied: number }>("/schedules/copy-week", { from_week: isoOf(fromDay), to_week: isoOf(toDay), site_id: siteId ?? null });
  await loadSchedule();
  return out.copied;
}

export function installScheduleRemote(): void {
  scheduleRemote.current = {
    async createShifts(rows, publish) {
      const ids: string[] = [];
      for (const row of rows) ids.push((await api.post<{ id: string }>("/schedules", oneOffBody(row))).id);
      if (publish && ids.length) await api.post("/schedules/publish", { schedule_ids: ids, notify: true, confirm_conflicts: true });
      await loadSchedule();
    },

    async updateShift(id, patch, current) {
      const m = meta.get(id);
      if (!m) return; // a row that has not been saved yet; the reload after its creation replaces it
      const next = { ...current, ...patch };
      if (!next.emp) throw new Error("A shift needs an employee");
      const tz = zoneOf(next.site);
      const startsAt = instantOn(isoOf(next.d), hhmm(next.s), tz);
      const endsAt = m.overnight ? new Date(Date.parse(startsAt) + m.durationMs).toISOString() : instantOn(isoOf(next.d), hhmm(next.e), tz);
      await api.patch(`/shifts/${id}`, {
        starts_at: startsAt,
        ends_at: endsAt,
        employee_id: next.emp !== current.emp ? need(next.emp) : undefined,
        site_id: next.site !== current.site ? next.site : undefined,
        notify: !m.draft,
      });
      await loadSchedule();
    },

    async removeShift(id) {
      if (!meta.has(id)) return;
      await api.delete(`/shifts/${id}`, { data: { reason: "Removed from the planner" } });
      await loadSchedule();
    },

    async scheduleIntervention(interventionId, shift) {
      await api.patch(`/schedules/${interventionId}`, {
        site_id: shift.site,
        valid_from: isoOf(shift.d),
        start_time: hhmm(shift.s),
        end_time: hhmm(shift.e),
        employee_ids: shift.emp ? [need(shift.emp)] : [],
      });
      await loadSchedule();
    },

    async publish() {
      const ids = [...new Set([...meta.values()].filter((m) => m.draft).map((m) => m.scheduleId))];
      if (ids.length) await api.post("/schedules/publish", { schedule_ids: ids, notify: true, confirm_conflicts: true });
      await loadSchedule();
    },

    reload: loadSchedule,
  };
}
