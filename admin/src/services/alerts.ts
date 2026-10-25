import { ESCALATION_ADMINS, type AlertItem, type AlertReason, type AlertRole, type AlertStatus, type AlertTab, type Severity } from "@/data/alerts";
import { api } from "@/lib/api";
import { clockIn, onFlagged } from "@/services/attendance";
import { employeeNoOf } from "@/services/org";
import { useEmployees } from "@/store/employees";
import { useSites } from "@/store/sites";
import type { JobTitle } from "@/types/employee";

interface ApiAlert {
  id: string;
  type: string;
  record_id: string | null;
  site_id: string;
  employee_id: string | null;
  employee_name: string | null;
  reasons: string[];
  severity: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
}

interface ApiAlertDetail {
  alert: ApiAlert;
  evidence: {
    distance_m: number | null;
    accuracy_m: number | null;
    device: { model: string | null; platform: string | null; app_version: string | null } | null;
    selfie_urls: string[];
    past_flags: number;
  } | null;
  notes: { id: string; author: string; body: string; created_at: string }[];
}

const TAB: Record<string, AlertTab> = { flagged: "flagged", missing_checkout: "miss", unscheduled: "uns", uncovered_intervention: "unc" };
const REASON: Record<string, AlertReason> = { OUTSIDE_GEOFENCE: "geo", MOCK_LOCATION: "mock", LOW_ACCURACY: "acc", TIME_TAMPERED: "tamper", DEVICE_MISMATCH: "dev", UNSCHEDULED: "uns" };
const ROLE: Partial<Record<JobTitle, AlertRole>> = {
  machinist: "machinist", forkliftOperator: "forkliftOperator", cleaner: "cleaner", technician: "technician", electrician: "electrician", driver: "driver", loader: "loader", inspector: "inspector",
};
/** The alert/leave screens' role label for an employee title. */
export const alertRoleOf = (title: JobTitle | undefined): AlertRole => (title && ROLE[title]) || "technician";

const SEVERITY: Record<string, Severity> = { high: "high", medium: "med", low: "low" };
const STATUS: Record<string, AlertStatus> = { open: "open", escalated: "open", approved: "approved", rejected: "rejected" };

const siteZone = (id: string) => useSites.getState().sites.find((s) => s.id === id)?.timezone ?? "UTC";
const dayKey = (iso: string, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));

/** Calendar days between an instant and now, in the site's zone. */
function daysAgo(iso: string, tz: string): number {
  const a = Date.parse(dayKey(iso, tz));
  const b = Date.parse(dayKey(new Date().toISOString(), tz));
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function toItem(a: ApiAlert): AlertItem {
  const tz = siteZone(a.site_id);
  const tab = TAB[a.type] ?? "flagged";
  const no = a.employee_id ? employeeNoOf(a.employee_id) : undefined;
  const emp = no ? useEmployees.getState().employees.find((e) => e.id === no) : undefined;
  const reason: AlertReason = tab === "miss" ? "miss" : tab === "unc" ? "unc" : (REASON[a.reasons[0]] ?? "geo");
  return {
    id: a.id, tab, reason, name: a.employee_name ?? "—", role: tab === "unc" ? "intervention" : ((emp && ROLE[emp.title]) ?? "technician"), site: a.site_id,
    days: daysAgo(a.created_at, tz), time: clockIn(a.created_at, tz), severity: SEVERITY[a.severity] ?? "med", status: STATUS[a.status] ?? "open",
    distance: 0, accuracy: 0, device: "—", registered: true, selfie: false, flagCount: 0, phone: emp?.phone ?? "—", previous: [], notes: [],
    real: true, employeeId: a.employee_id ?? undefined, title: a.employee_name ?? undefined, description: a.reasons.join(", "), resolutionNote: a.resolution_note ?? undefined,
    ...(a.status === "approved" || a.status === "rejected" ? { resolution: { by: "", outcome: undefined } } : {}),
  };
}

/** All alerts the user may see. */
export async function loadAlerts(): Promise<AlertItem[]> {
  const out = await api.get<{ items: ApiAlert[] }>("/alerts", { params: { tab: "all", limit: 200 } });
  return out.items.map(toItem);
}

/** The evidence and notes that only the detail endpoint returns. */
export async function loadAlertDetail(id: string): Promise<Partial<AlertItem>> {
  const d = await api.get<ApiAlertDetail>(`/alerts/${id}`);
  const ev = d.evidence;
  const device = ev?.device ? [ev.device.model, ev.device.platform, ev.device.app_version ? `app ${ev.device.app_version}` : null].filter(Boolean).join(" · ") : "—";
  return {
    distance: Math.round(ev?.distance_m ?? 0), accuracy: Math.round(ev?.accuracy_m ?? 0), device: device || "—", selfie: (ev?.selfie_urls.length ?? 0) > 0, flagCount: ev?.past_flags ?? 0,
    notes: d.notes.map((n) => ({ who: n.author, when: new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(n.created_at)), text: n.body })),
  };
}

export async function resolveAlert(id: string, outcome: "approved" | "rejected", reason: string): Promise<void> {
  await api.post(`/alerts/${id}/${outcome === "approved" ? "approve" : "reject"}`, { reason });
}

export async function bulkResolveAlerts(ids: string[], outcome: "approved" | "rejected", reason: string): Promise<void> {
  await api.post("/alerts/bulk-resolve", { ids, outcome, reason });
}

export async function addAlertNote(id: string, body: string): Promise<void> {
  await api.post(`/alerts/${id}/notes`, { body });
}

export async function escalateAlert(id: string, assignTo: string, note: string): Promise<void> {
  await api.post(`/alerts/${id}/escalate`, { assign_to: assignTo, note: note || null });
}

export interface Assignee {
  id: string;
  name: string;
}

/** People an alert can be escalated to. Needs the users permission; otherwise the list is empty. */
export async function loadAssignees(): Promise<Assignee[]> {
  try {
    const users = await api.get<{ id: string; full_name: string; status: string }[]>("/users");
    return users.filter((u) => u.status === "active").map((u) => ({ id: u.id, name: u.full_name }));
  } catch {
    return [];
  }
}

/** Run `fn` whenever a new flag is raised (live pushes). */
export const onNewFlag = (fn: () => void) => onFlagged(fn);

export { ESCALATION_ADMINS };
