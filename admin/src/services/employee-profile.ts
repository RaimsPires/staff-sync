import { api } from "@/lib/api";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { clockIn } from "@/services/attendance";
import { employeeUuidOfNo } from "@/services/org";
import { categoryOf } from "@/services/audit";
import { useSites } from "@/store/sites";
import type { RecurringSchedule, DayRecord, DayStatus } from "@/features/employees/profile/profile-model";
import { parseTime } from "@/lib/time";

const uuid = (no: string): string => {
  const id = employeeUuidOfNo(no);
  if (!id) throw new Error(`Unknown employee ${no}`);
  return id;
};

// --- attendance -------------------------------------------------------------------------------------------

interface ApiRecord {
  date: string;
  site: { id: string };
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
  base_status: string;
}

/** This month's days for an employee, from their attendance records. */
export async function loadMonth(no: string): Promise<DayRecord[]> {
  const month = `${DEMO_YEAR}-${String(DEMO_MONTH + 1).padStart(2, "0")}`;
  const out = await api.get<{ records: ApiRecord[] }>(`/employees/${uuid(no)}/attendance`, { params: { month } });
  const byDay = new Map<number, ApiRecord>();
  for (const r of out.records) byDay.set(Number(r.date.slice(8, 10)), r);
  const zones = new Map(useSites.getState().sites.map((s) => [s.id, s.timezone]));
  const days = new Date(DEMO_YEAR, DEMO_MONTH + 1, 0).getDate();
  return Array.from({ length: days }, (_, i): DayRecord => {
    const day = i + 1;
    const weekday = new Date(DEMO_YEAR, DEMO_MONTH, day).getDay();
    if (weekday === 0 || weekday === 6) return { day, weekend: true };
    const r = byDay.get(day);
    if (day > DEMO_TODAY) return { day, future: true };
    if (!r) return { day, status: day === DEMO_TODAY ? undefined : "absent", today: day === DEMO_TODAY || undefined };
    const tz = zones.get(r.site.id) ?? "UTC";
    const status: DayStatus = r.base_status === "on_leave" || r.status === "on_leave" ? "leave" : r.base_status === "late" ? "late" : r.base_status === "absent" ? "absent" : "present";
    return {
      day, status, today: day === DEMO_TODAY || undefined,
      inMin: r.check_in_at ? parseTime(clockIn(r.check_in_at, tz)) : null, outMin: r.check_out_at ? parseTime(clockIn(r.check_out_at, tz)) : null,
    };
  });
}

// --- device and badge -------------------------------------------------------------------------------------

export interface DeviceInfo {
  registered: boolean;
  model: string | null;
  platform: string | null;
  appVersion: string | null;
  registeredAt: string | null;
  lastActiveAt: string | null;
}

export async function loadDevice(no: string): Promise<DeviceInfo> {
  const d = await api.get<{ registered: boolean; model: string | null; platform: string | null; app_version: string | null; registered_at: string | null; last_active_at: string | null }>(`/employees/${uuid(no)}/device`);
  return { registered: d.registered, model: d.model, platform: d.platform, appVersion: d.app_version, registeredAt: d.registered_at, lastActiveAt: d.last_active_at };
}

export async function resetDevice(no: string): Promise<void> {
  await api.post(`/employees/${uuid(no)}/device/reset`);
}

/** Issue a new badge: the PIN and QR are shown once. */
export async function issueBadge(no: string): Promise<{ pin: string; token: string; qrSvg: string }> {
  const b = await api.post<{ pin: string; badge_token: string; qr_svg: string }>(`/employees/${uuid(no)}/badge`);
  return { pin: b.pin, token: b.badge_token, qrSvg: b.qr_svg };
}

export async function inviteEmployee(no: string): Promise<void> {
  await api.post(`/employees/${uuid(no)}/invite`);
}

// --- activity and notes -----------------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  /** Category the screen has a translation for, or null. */
  category: ReturnType<typeof categoryOf>;
  text: string;
  actor: string;
  at: string;
}

const humanize = (a: string) => {
  const t = a.replace(/[._]/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export async function loadActivity(no: string): Promise<ActivityEntry[]> {
  const rows = await api.get<{ id: string; at: string; actor_name: string | null; action: string }[]>(`/employees/${uuid(no)}/activity`);
  return rows.map((r) => ({ id: r.id, category: categoryOf(r.action), text: humanize(r.action), actor: r.actor_name ?? "", at: r.at }));
}

export interface EmployeeNote {
  id: string;
  author: string;
  body: string;
  at: string;
}

export async function loadNotes(no: string): Promise<EmployeeNote[]> {
  const rows = await api.get<{ id: string; author: string | null; body: string; created_at: string }[]>(`/employees/${uuid(no)}/notes`);
  return rows.map((r) => ({ id: r.id, author: r.author ?? "", body: r.body, at: r.created_at }));
}

export async function addNote(no: string, body: string): Promise<void> {
  await api.post(`/employees/${uuid(no)}/notes`, { body });
}

// --- recurring schedules ----------------------------------------------------------------------------------

interface ApiSchedule {
  id: string;
  type: string;
  site_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  employee_ids: string[];
  valid_to: string | null;
}

/** A schedule on screen plus what the server needs to change it. */
export interface PersonSchedule extends RecurringSchedule {
  uuid: string;
  /** Other employees on the same schedule: it can only be changed from the planner then. */
  sharedWith: number;
}

let nextLocal = 1;

export async function loadPersonSchedules(no: string): Promise<PersonSchedule[]> {
  const id = uuid(no);
  const all = await api.get<ApiSchedule[]>("/schedules", { params: { type: "recurring" } });
  return all
    .filter((s) => s.employee_ids.includes(id) && (!s.valid_to || s.valid_to >= new Date().toISOString().slice(0, 10)))
    .map((s) => ({ id: nextLocal++, uuid: s.id, days: [...s.days_of_week].sort(), start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5), site: s.site_id, sharedWith: s.employee_ids.length - 1 }));
}

export async function saveSchedule(no: string, s: { uuid?: string; days: number[]; start: string; end: string; site: string }): Promise<void> {
  if (s.uuid) {
    await api.patch(`/schedules/${s.uuid}`, { days_of_week: s.days, start_time: s.start, end_time: s.end, site_id: s.site });
    return;
  }
  const created = await api.post<{ id: string }>("/schedules", {
    type: "recurring", site_id: s.site, title: "Weekly schedule", days_of_week: s.days, start_time: s.start, end_time: s.end, crosses_midnight: false,
    valid_from: new Date().toISOString().slice(0, 10), employee_ids: [uuid(no)],
  });
  await api.post("/schedules/publish", { schedule_ids: [created.id], notify: true, confirm_conflicts: true });
}

export async function removeSchedule(scheduleUuid: string): Promise<void> {
  await api.delete(`/schedules/${scheduleUuid}`, { data: { reason: "Removed from the employee profile" } });
}
