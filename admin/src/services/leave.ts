import { api } from "@/lib/api";
import { alertRoleOf } from "@/services/alerts";
import { employeeNoOf } from "@/services/org";
import { useAuth } from "@/store/auth";
import { useEmployees } from "@/store/employees";
import { leaveRemote, useLeave, type BalanceRow, type Decision } from "@/store/leave";
import { useSettings } from "@/store/settings";
import { useSites } from "@/store/sites";
import type { LeaveRequest, LeaveStage, LeaveStatus } from "@/types/leave";
import type { LeaveTypeDef } from "@/types/settings";

interface ApiTimeline {
  actor: string | null;
  action: string;
  at: string;
  comment: string | null;
}

interface ApiLeave {
  id: string;
  employee_id: string;
  employee_name: string | null;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  start_half: string | null;
  end_half: string | null;
  days: number;
  reason: string;
  attachment_keys: string[];
  status: string;
  levels: number;
  approver: string | null;
  recommendation: string | null;
  recommendation_comment: string | null;
  timeline?: ApiTimeline[];
  created_at: string;
}

interface ApiType {
  id: string;
  name_en: string;
  name_fr: string;
  color: string;
  paid: boolean;
  yearly_allowance: number;
  requires_document: boolean;
  min_notice_days: number;
  half_day_allowed: boolean;
  carry_over_max: number;
}

interface ApiBalances {
  employee_id: string;
  balances: { balance_id: string; leave_type_id: string; year: number; entitled: number; adjusted: number; used: number; pending: number; remaining: number }[];
}

const keyOf = (name: string, type: string, year: number) => `${name}|${type}|${year}`;
const WAITING = ["pending", "recommended", "changes_requested", "cancellation_requested"];

function stageOf(a: ApiLeave): LeaveStage {
  switch (a.status) {
    case "recommended": return "rec";
    case "changes_requested": return "chg";
    case "approved": return "done";
    case "rejected": return "no";
    case "cancelled": return "can";
    default: return a.levels === 2 && !a.recommendation ? "site" : "hr";
  }
}

const statusOf = (s: string): LeaveStatus => (s === "approved" || s === "rejected" || s === "cancelled" ? s : "pending");
const ACTION: Record<string, "approve" | "reject" | "changes" | "cancel"> = { approved: "approve", rejected: "reject", changes_requested: "changes", cancelled: "cancel" };

function toRequest(a: ApiLeave, balances: Record<string, BalanceRow>): LeaveRequest {
  const no = employeeNoOf(a.employee_id);
  const emp = no ? useEmployees.getState().employees.find((e) => e.id === no) : undefined;
  const name = a.employee_name ?? emp?.name ?? "—";
  const log = (a.timeline ?? []).filter((t) => ACTION[t.action]).map((t) => ({ kind: ACTION[t.action], who: t.actor ?? "", comment: t.comment ?? "" }));
  const rejected = [...(a.timeline ?? [])].reverse().find((t) => t.action === "rejected");
  const canDecide = useAuth.getState().me?.permissions.includes("leave.approve") ?? false;
  return {
    id: a.id, name, role: alertRoleOf(emp?.title), site: emp?.siteIds[0] ?? "", type: a.leave_type_id, from: a.start_date, to: a.end_date, days: a.days,
    balance: balances[keyOf(name, a.leave_type_id, Number(a.start_date.slice(0, 4)))]?.remaining ?? 0, attachment: a.attachment_keys.length > 0,
    stage: stageOf(a), stageBy: a.approver ?? undefined, note: a.status === "recommended" ? "recommended" : undefined, submitted: a.created_at, status: statusOf(a.status),
    half: a.start_half === "afternoon" ? "PM" : a.start_half === "morning" ? "AM" : undefined, waitingOnMe: WAITING.includes(a.status) && canDecide,
    rejection: rejected?.comment ?? undefined,
    recommendation: a.recommendation === "approve" || a.recommendation === "reject" ? { decision: a.recommendation, comment: a.recommendation_comment ?? "" } : undefined,
    log,
  };
}

function toBalances(rows: ApiBalances[]): Record<string, BalanceRow> {
  const out: Record<string, BalanceRow> = {};
  for (const r of rows) {
    const no = employeeNoOf(r.employee_id);
    const name = no ? useEmployees.getState().employees.find((e) => e.id === no)?.name : undefined;
    if (!name) continue;
    for (const b of r.balances) out[keyOf(name, b.leave_type_id, b.year)] = { id: b.balance_id, entitled: b.entitled, adjusted: b.adjusted, used: b.used, pending: b.pending, remaining: b.remaining };
  }
  return out;
}

/** Leave types as configured on the server, in the shape the settings store and the leave screens use. */
export async function loadLeaveTypes(): Promise<void> {
  const types = await api.get<ApiType[]>("/leave/types");
  const defs: LeaveTypeDef[] = types.map((t) => ({
    id: t.id, name: t.name_en, builtIn: false, color: t.color, paid: t.paid, allowance: t.yearly_allowance, document: t.requires_document, notice: t.min_notice_days, half: t.half_day_allowed, carry: t.carry_over_max,
  }));
  useSettings.setState({ leaveTypes: defs });
}

/** Balances of every employee for a year (merged into what is already loaded). */
export async function loadBalances(year: number): Promise<void> {
  const rows = await api.get<ApiBalances[]>("/leave/balances", { params: { year } });
  useLeave.setState((s) => ({ balances: { ...s.balances, ...toBalances(rows) } }));
}

/** Public holidays of the year, across the company's holiday calendars. */
async function loadHolidays(year: number): Promise<Record<string, string>> {
  try {
    const calendars = await api.get<{ id: string }[]>("/holidays/calendars");
    const lists = await Promise.all(calendars.map((c) => api.get<{ date: string; name: string }[]>("/holidays", { params: { calendar_id: c.id, year } })));
    return Object.fromEntries(lists.flat().map((h) => [h.date, h.name]));
  } catch {
    return {};
  }
}

/** Replace the demo requests with the company's real ones, plus balances and holidays. */
export async function loadLeave(): Promise<void> {
  const year = new Date().getFullYear();
  const [requests, thisYear, nextYear, holidays] = await Promise.all([
    api.get<ApiLeave[]>("/leave/requests", { params: { limit: 200 } }),
    api.get<ApiBalances[]>("/leave/balances", { params: { year } }),
    api.get<ApiBalances[]>("/leave/balances", { params: { year: year + 1 } }),
    loadHolidays(year),
  ]);
  const balances = { ...toBalances(thisYear), ...toBalances(nextYear) };
  useLeave.setState({ requests: requests.map((r) => toRequest(r, balances)), balances, holidays });
}

/** The approval trail and rejection reason, which only the detail endpoint returns. */
export async function loadLeaveDetail(id: string): Promise<void> {
  const d = await api.get<{ request: ApiLeave }>(`/leave/requests/${id}`);
  const { balances, requests } = useLeave.getState();
  const full = toRequest(d.request, balances);
  useLeave.setState({ requests: requests.map((r) => (r.id === id ? { ...r, log: full.log, rejection: full.rejection } : r)) });
}

/** Short-lived download links for a request's uploaded files. */
export async function loadLeaveAttachments(id: string): Promise<{ key: string; url: string }[]> {
  return (await api.get<{ attachments: { key: string; url: string }[] }>(`/leave/requests/${id}`)).attachments;
}

/** Change a balance by `delta` days with a reason, then refresh that year. */
export async function adjustBalance(balanceId: string, delta: number, reason: string, year: number): Promise<void> {
  await api.post(`/leave/balances/${balanceId}/adjust`, { delta, reason });
  await loadBalances(year);
}

const PATH: Record<Decision, string> = { approve: "approve", reject: "reject", changes: "request-changes", cancel: "cancel" };

export function installLeaveRemote(): void {
  leaveRemote.current = {
    async decide(ids, decision, comment) {
      if (ids.length > 1 && (decision === "approve" || decision === "reject")) {
        const out = await api.post<{ processed: string[]; failed: { id: string; error: string }[] }>("/leave/requests/bulk", { ids, action: decision, reason: comment || null });
        await loadLeave();
        if (out.failed.length) throw new Error(`${out.failed.length} request(s) could not be ${decision === "approve" ? "approved" : "rejected"}`);
        return;
      }
      for (const id of ids) await api.post(`/leave/requests/${id}/${PATH[decision]}`, { comment: comment || null });
      await loadLeave();
    },
    reload: loadLeave,
  };
}

/** A site manager's opinion on a pending request. It does not decide it: the approver still does. */
export async function recommendLeave(id: string, decision: "approve" | "reject", comment: string): Promise<void> {
  await api.post(`/leave/requests/${id}/recommend`, { decision, comment });
  await loadLeave();
}

/** The employee's shifts that fall inside a request (what the leave would remove), one entry per working day. */
export async function loadLeaveCoverage(id: string): Promise<{ t: number; intervention: boolean; early: boolean }[]> {
  const c = await api.get<{ affected_shifts: { starts_at: string; intervention: boolean; site_id: string }[] }>(`/leave/requests/${id}/coverage`);
  const zones = new Map(useSites.getState().sites.map((x) => [x.id, x.timezone]));
  return c.affected_shifts.map((x) => {
    const tz = zones.get(x.site_id) ?? "UTC";
    const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(x.starts_at)).split("-").map(Number);
    const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: tz }).format(new Date(x.starts_at))) % 24;
    return { t: Date.UTC(y, m - 1, d), intervention: x.intervention, early: hour < 7 };
  });
}
