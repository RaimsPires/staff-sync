import { api } from "@/lib/api";
import { formatDuration, parseTime } from "@/lib/time";
import { employeeNoOf } from "@/services/org";
import { DEMO_MONTH, DEMO_TODAY, DEMO_YEAR } from "@/data/live";
import { useData } from "@/store/data";
import { useEmployees } from "@/store/employees";
import { useLiveFeed } from "@/store/live-feed";
import { useSites } from "@/store/sites";
import type { AttendanceRecord, CheckMethod, JobKey, RecordStatus } from "@/types/domain";
import type { JobTitle } from "@/types/employee";

interface ApiLiveRow {
  employee_id: string;
  name: string;
  shift_id: string;
  scheduled_start: string;
  scheduled_end: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
  method: string | null;
  distance_m: number | null;
  flags: { reason: string; distance_m?: number | null }[];
  record_id: string | null;
  note: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
}

interface ApiLiveSite {
  site_id: string;
  rows: ApiLiveRow[];
}

/** What the API needs to act on a row; the screens know rows only by a small number. */
export interface RowRef {
  shiftId: string | null;
  recordId: string | null;
  employeeId: string;
  siteId: string;
  /** `YYYY-MM-DD` in the site's zone; today's board rows leave it out. */
  date?: string;
}

const numbers = new Map<string, number>();
const refs = new Map<number, RowRef>();
let next = 1;
/** Past days' records are numbered from 1000, the range the store treats as history. */
let nextHistory = 1000;

/** Stable small number for a row (screens key rows by number). `key` is the shift id (board) or the record id (history). */
function numberFor(ref: RowRef, key: string | null = ref.shiftId, history = false): number {
  const k = key ?? `rec:${ref.recordId}`;
  let n = numbers.get(k);
  if (n === undefined) {
    n = history ? nextHistory++ : next++;
    numbers.set(k, n);
  }
  refs.set(n, ref);
  return n;
}

export const refOf = (id: number): RowRef | undefined => refs.get(id);

const STATUS: Record<string, RecordStatus> = {
  on_time: "ontime", late: "late", early_leave: "early", overtime: "overtime", missing_checkout: "missing", absent: "absent",
  on_leave: "leave", holiday: "holiday", flagged: "flagged", not_arrived: "scheduled",
};
const METHOD: Record<string, CheckMethod> = { self: "app", qr: "qr", proxy: "behalf", manual: "admin", admin: "admin" };
const JOB: Partial<Record<JobTitle, JobKey>> = {
  electrician: "electrician", driver: "driver", cleaner: "cleaningAgent", forkliftOperator: "forkliftOperator", technician: "siteTechnician",
  loader: "dockAgent", inspector: "safetyInspector", machinist: "craneOperator", siteManager: "dockSupervisor",
};

/** Clock time ("08:05") of an instant in a site's time zone. */
export function clockIn(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(iso));
}

/** The instant for a clock time on a given local date (`YYYY-MM-DD`) in a time zone. */
export function instantOn(date: string, time: string, timeZone: string): string {
  const guess = new Date(`${date}T${time}:00Z`);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(guess).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return new Date(guess.getTime() - (asUtc - guess.getTime())).toISOString();
}

/** The instant for a clock time on a site's local date (today unless `at` is given). */
export function instantFor(time: string, timeZone: string, at = new Date()): string {
  return instantOn(new Intl.DateTimeFormat("en-CA", { timeZone }).format(at), time, timeZone);
}

/** "23 Oct 10:42": the form the record drawer shows for when something was signed off. */
function approvalLabel(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone }).format(d);
  return `${day} ${clockIn(iso, timeZone)}`;
}

function toRecord(row: ApiLiveRow, siteId: string, tz: string): AttendanceRecord {
  const id = numberFor({ shiftId: row.shift_id, recordId: row.record_id, employeeId: row.employee_id, siteId });
  const no = employeeNoOf(row.employee_id);
  const title = no ? useEmployees.getState().employees.find((e) => e.id === no)?.title : undefined;
  const inAt = row.check_in_at ? clockIn(row.check_in_at, tz) : "";
  const outAt = row.check_out_at ? clockIn(row.check_out_at, tz) : "";
  const flag = row.flags[0];
  const late = inAt ? parseTime(inAt) - parseTime(row.scheduled_start) : 0;
  return {
    id, emp: numberFor({ shiftId: null, recordId: null, employeeId: row.employee_id, siteId }, `emp:${row.employee_id}`), name: row.name, job: (title && JOB[title]) || "siteTechnician",
    site: siteId, sched: `${row.scheduled_start}–${row.scheduled_end}`, kind: "recurring", in: inAt, out: outAt,
    worked: inAt ? (outAt ? formatDuration(inAt, outAt) : "0m") : "—", status: STATUS[row.status] ?? "scheduled", method: row.method ? (METHOD[row.method] ?? "app") : "",
    ...(flag ? { flag: flag.reason === "MOCK_LOCATION" ? ("mock" as const) : ("dist" as const), dist: `${Math.round(flag.distance_m ?? row.distance_m ?? 0)} m` } : {}),
    ...(late > 0 ? { lateBy: late } : {}),
    ...(row.approved_by ? { approved: row.approved_by, approvedAt: approvalLabel(row.approved_at, tz) } : {}),
  };
}

export interface FlagNotice {
  name: string;
  distance: string;
  siteName: string;
}
const flagListeners = new Set<(n: FlagNotice) => void>();
/** Be told when a row becomes flagged between two reads. Returns the unsubscribe function. */
export function onFlagged(fn: (n: FlagNotice) => void): () => void {
  flagListeners.add(fn);
  return () => void flagListeners.delete(fn);
}

let loading: Promise<void> | null = null;

/** Replace today's records with the live board from the API and mark the rows that changed since the last read. */
export function loadToday(): Promise<void> {
  loading ??= (async () => {
    try {
      const sites = await api.get<ApiLiveSite[]>("/attendance/live");
      const zones = new Map(useSites.getState().sites.map((s) => [s.id, s.timezone]));
      const prior = useData.getState().today;
      const before = new Map(prior.map((r) => [r.id, `${r.in}|${r.out}|${r.status}`]));
      const wasFlagged = new Set(prior.filter((r) => r.flag).map((r) => r.id));
      const siteNames = new Map(useSites.getState().sites.map((s) => [s.id, s.name]));
      const today = sites.flatMap((s) => s.rows.map((r) => toRecord(r, s.site_id, zones.get(s.site_id) ?? "UTC")));
      const changed = today.filter((r) => before.has(r.id) && before.get(r.id) !== `${r.in}|${r.out}|${r.status}`).map((r) => r.id);
      useData.setState({ today });
      useLiveFeed.setState({ loadedAt: Date.now() });
      if (prior.length)
        for (const r of today)
          if (r.flag && !wasFlagged.has(r.id)) flagListeners.forEach((fn) => fn({ name: r.name, distance: r.dist ?? "?", siteName: siteNames.get(r.site) ?? "" }));
      if (changed.length) useLiveFeed.getState().markFresh(changed);
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Check an employee in or out on their behalf (dashboard use needs a reason). */
export async function proxyCheck(id: number, kind: "in" | "out", input: { time: string; reason: string; note: string }): Promise<void> {
  const ref = refs.get(id);
  if (!ref) throw new Error("Unknown record");
  const tz = useSites.getState().sites.find((s) => s.id === ref.siteId)?.timezone ?? "UTC";
  await api.post(`/attendance/proxy/${kind === "in" ? "check-in" : "check-out"}`, {
    employee_id: ref.employeeId,
    site_id: ref.siteId,
    shift_id: ref.shiftId ?? undefined,
    client_event_id: crypto.randomUUID(),
    captured_at: instantFor(input.time, tz),
    accept_unscheduled: false,
    reason: [input.reason, input.note].filter(Boolean).join(": "),
  });
  await loadToday();
  useLiveFeed.getState().markFresh([id]);
}

/** Mark the given not-yet-arrived rows absent. */
export async function markAbsent(ids: number[]): Promise<void> {
  const shiftIds = ids.map((id) => refs.get(id)?.shiftId).filter((x): x is string => !!x);
  if (!shiftIds.length) return;
  await api.post("/attendance/bulk", { action: "mark_absent", record_ids: [], shift_ids: shiftIds, reason: "Marked absent from the live board" });
  await loadToday();
}

// --- past days ----------------------------------------------------------------------------------------------

interface ApiRecord {
  id: string;
  date: string;
  employee_id: string;
  employee_name: string | null;
  site: { id: string; name: string };
  shift_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
  late_by_minutes: number | null;
  method: string;
  proxy_by: string | null;
  flags: { reason: string; distance_m?: number | null }[];
  flag_outcome: string | null;
  employee_comment: string | null;
  admin_note: string | null;
  offline_synced: boolean;
  distance_m: number | null;
  worked_minutes: number | null;
  version: number;
  approved_by?: string | null;
  approved_at?: string | null;
}

function historyRecord(r: ApiRecord, tz: string): AttendanceRecord {
  const id = numberFor({ shiftId: r.shift_id, recordId: r.id, employeeId: r.employee_id, siteId: r.site.id, date: r.date }, `rec:${r.id}`, true);
  const no = employeeNoOf(r.employee_id);
  const title = no ? useEmployees.getState().employees.find((e) => e.id === no)?.title : undefined;
  const inAt = r.check_in_at ? clockIn(r.check_in_at, tz) : "";
  const outAt = r.check_out_at ? clockIn(r.check_out_at, tz) : "";
  const flag = r.flags[0];
  return {
    id, emp: numberFor({ shiftId: null, recordId: null, employeeId: r.employee_id, siteId: r.site.id }, `emp:${r.employee_id}`), name: r.employee_name ?? "—", job: (title && JOB[title]) || "siteTechnician",
    site: r.site.id, sched: r.scheduled_start ? `${r.scheduled_start}–${r.scheduled_end}` : "—", kind: "recurring", in: inAt, out: outAt, date: Number(r.date.slice(8, 10)),
    worked: r.worked_minutes ? `${Math.floor(r.worked_minutes / 60)}h ${String(r.worked_minutes % 60).padStart(2, "0")}m` : "—",
    status: STATUS[r.status] ?? "ontime", method: METHOD[r.method] ?? "app", offline: r.offline_synced || undefined, proxyBy: r.proxy_by ?? undefined,
    ...(flag ? { flag: flag.reason === "MOCK_LOCATION" ? ("mock" as const) : ("dist" as const), dist: `${Math.round(flag.distance_m ?? r.distance_m ?? 0)} m` } : {}),
    ...(r.flag_outcome === "approved" ? { cleared: true } : r.flag_outcome === "rejected" ? { fraud: true } : {}),
    ...(r.late_by_minutes ? { lateBy: r.late_by_minutes } : {}),
    ...(r.approved_by ? { approved: r.approved_by, approvedAt: approvalLabel(r.approved_at, tz) } : {}),
  };
}

/** Earlier days of the current month (the attendance screens work inside one month). */
export async function loadHistory(): Promise<void> {
  if (DEMO_TODAY <= 1) {
    useData.setState({ history: [] });
    return;
  }
  const month = String(DEMO_MONTH + 1).padStart(2, "0");
  const items: ApiRecord[] = [];
  let cursor: string | null = null;
  do {
    const page: { items: ApiRecord[]; next_cursor: string | null } = await api.get("/attendance", { params: { from: `${DEMO_YEAR}-${month}-01`, to: `${DEMO_YEAR}-${month}-${String(DEMO_TODAY - 1).padStart(2, "0")}`, limit: 200, ...(cursor ? { cursor } : {}) } });
    items.push(...page.items);
    cursor = page.next_cursor;
  } while (cursor);
  const zones = new Map(useSites.getState().sites.map((s) => [s.id, s.timezone]));
  useData.setState({ history: items.map((r) => historyRecord(r, zones.get(r.site.id) ?? "UTC")) });
}

// --- changes made from the attendance screens ---------------------------------------------------------------

const STATUS_OUT: Partial<Record<RecordStatus, string>> = {
  ontime: "on_time", late: "late", early: "early_leave", overtime: "overtime", missing: "missing_checkout", absent: "absent", leave: "on_leave", holiday: "holiday",
};

const need = (id: number): RowRef => {
  const ref = refs.get(id);
  if (!ref) throw new Error("Unknown record");
  return ref;
};
const zoneOf = (siteId: string) => useSites.getState().sites.find((s) => s.id === siteId)?.timezone ?? "UTC";
const dateOf = (ref: RowRef) => ref.date ?? new Intl.DateTimeFormat("en-CA", { timeZone: zoneOf(ref.siteId) }).format(new Date());
const refresh = () => Promise.all([loadToday(), loadHistory()]).then(() => undefined);

/** Change a record's times or status. Rows with no record yet (not arrived) get one created. */
export async function editRecord(id: number, edit: { in?: string; out?: string; status?: RecordStatus; reason: string }): Promise<void> {
  const ref = need(id);
  const tz = zoneOf(ref.siteId);
  const date = dateOf(ref);
  const at = (t: string | undefined) => (t ? instantOn(date, t, tz) : undefined);
  const status = edit.status ? STATUS_OUT[edit.status] : undefined;
  if (ref.recordId) {
    await api.patch(`/attendance/${ref.recordId}`, { check_in_at: at(edit.in), check_out_at: at(edit.out), status, reason: edit.reason });
  } else {
    if (!edit.in) throw new Error("A check-in time is required");
    await api.post("/attendance", { employee_id: ref.employeeId, site_id: ref.siteId, check_in_at: at(edit.in), check_out_at: at(edit.out), status, reason: edit.reason });
  }
  await refresh();
}

/** Create a record by hand for an employee. */
export async function createRecord(input: { empRowId: number; siteId?: string; date: string; in: string; out?: string; status?: RecordStatus; reason: string; notes?: string }): Promise<void> {
  const ref = need(input.empRowId);
  const siteId = input.siteId ?? ref.siteId;
  const tz = zoneOf(siteId);
  await api.post("/attendance", {
    employee_id: ref.employeeId, site_id: siteId, check_in_at: input.in ? instantOn(input.date, input.in, tz) : instantOn(input.date, "00:00", tz),
    check_out_at: input.out ? instantOn(input.date, input.out, tz) : undefined, status: input.status ? STATUS_OUT[input.status] : undefined, reason: input.reason, notes: input.notes,
  });
  await refresh();
}

/** Approve records (bulk). */
export async function approveRecords(ids: number[], reason = "Approved from the attendance page"): Promise<void> {
  const recordIds = ids.map((id) => refs.get(id)?.recordId).filter((x): x is string => !!x);
  if (!recordIds.length) return;
  await api.post("/attendance/bulk", { action: "approve", record_ids: recordIds, shift_ids: [], reason });
  await refresh();
}

/** Mark records absent: by record where one exists, otherwise by shift. */
export async function markRecordsAbsent(ids: number[], reason = "Marked absent from the attendance page"): Promise<void> {
  const rows = ids.map((id) => refs.get(id)).filter((r): r is RowRef => !!r);
  const recordIds = rows.map((r) => r.recordId).filter((x): x is string => !!x);
  const shiftIds = rows.filter((r) => !r.recordId).map((r) => r.shiftId).filter((x): x is string => !!x);
  if (!recordIds.length && !shiftIds.length) return;
  await api.post("/attendance/bulk", { action: "mark_absent", record_ids: recordIds, shift_ids: shiftIds, reason });
  await refresh();
}

/** Decide on the alert raised for a flagged record. */
export async function reviewFlag(id: number, outcome: "approved" | "rejected", reason: string): Promise<void> {
  const ref = need(id);
  if (!ref.recordId) throw new Error("This row has no check-in to review");
  const { items } = await api.get<{ items: { id: string; record_id: string | null; status: string }[] }>("/alerts", { params: { tab: "flagged", limit: 200 } });
  const alert = items.find((a) => a.record_id === ref.recordId);
  if (!alert) throw new Error("No open alert for this record");
  await api.post(`/alerts/${alert.id}/${outcome === "approved" ? "approve" : "reject"}`, { reason });
  await refresh();
}

export async function addRecordNote(id: number, body: string): Promise<void> {
  const ref = need(id);
  if (!ref.recordId) throw new Error("This row has no record to annotate");
  await api.post(`/attendance/${ref.recordId}/notes`, { body });
}

export async function deleteRecord(id: number, reason: string): Promise<void> {
  const ref = need(id);
  if (!ref.recordId) throw new Error("This row has no record to delete");
  await api.delete(`/attendance/${ref.recordId}`, { data: { reason } });
  await refresh();
}

// --- dashboard overview ---------------------------------------------------------------------------------------

interface ApiOverview {
  empty: boolean;
  kpis: { expected: number; present: number; yesterday: { expected: number; present: number } };
  trend: { date: string; expected: number; present: number; rate: number | null }[];
  needs_attention: Record<string, number>;
}

export interface Overview {
  /** Days with attendance data, oldest first; `rate` is a percentage. */
  trend: { date: string; rate: number }[];
  average: number;
  /** Change of the second half of the window against the first, in points. */
  delta: number;
  yesterday: { expected: number; present: number };
}

export async function loadOverview(days: number): Promise<Overview> {
  const o = await api.get<ApiOverview>("/dashboard/overview", { params: { days } });
  const trend = o.trend.filter((p) => p.rate !== null).map((p) => ({ date: p.date, rate: (p.rate as number) * 100 }));
  const mean = (xs: { rate: number }[]) => (xs.length ? xs.reduce((a, b) => a + b.rate, 0) / xs.length : 0);
  const half = Math.floor(trend.length / 2);
  return { trend, average: mean(trend), delta: half >= 1 ? mean(trend.slice(trend.length - half)) - mean(trend.slice(0, half)) : 0, yesterday: o.kpis.yesterday };
}
