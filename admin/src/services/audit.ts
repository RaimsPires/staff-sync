import { api } from "@/lib/api";
import type { AuditAction, AuditEntry, AuditTargetType } from "@/types/audit";

interface ApiAudit {
  id: string;
  at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  ip: string | null;
  user_agent: string | null;
}

/** The screens' action category for a server action such as "attendance.edited". */
export function categoryOf(action: string): AuditAction | null {
  const [area, verb = ""] = action.split(".");
  if (action === "attendance.proxy_check_in" || action.startsWith("attendance.proxy")) return "proxy";
  if (area === "attendance") return "rec";
  if (area === "alert") return verb === "rejected" ? "flagr" : verb === "approved" ? "flag" : null;
  if (area === "leave") return verb.includes("reject") ? "lvno" : verb.includes("approve") ? "lvok" : null;
  if (area === "role" || action === "user.roles_changed" || action === "user.invited" || action === "user.access_revoked") return "role";
  if (area === "settings" || area === "company" || area === "apikey" || area === "webhook" || area === "leave_type") return "set";
  if (action === "employee.deactivated") return "deact";
  if (area === "employee" || area === "device") return "emp";
  if (area === "site" || area === "branch") return "site";
  if (area === "schedule" || area === "shift") return "sched";
  if (area === "report") return "exp";
  return null;
}

const TARGET: Record<string, AuditTargetType> = {
  attendance: "rec", correction: "rec", employee: "emp", device: "emp", leave_request: "lv", leave_balance: "lv", leave_type: "set", role: "role", settings: "set", company: "set", api_key: "set", webhook: "set",
  site: "site", branch: "site", user: "user", schedule: "sched", shift: "sched", report: "rep", alert: "flag",
};

const humanize = (action: string) => {
  const text = action.replace(/[._]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const show = (v: unknown): string => (v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

function diffOf(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return keys.map((k) => ({ field: k.replace(/_/g, " "), before: show(before?.[k]), after: show(after?.[k]) }));
}

/** A readable device from a user agent: "Chrome · macOS". */
function deviceOf(ua: string | null): string {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /StaffSync|Expo|okhttp|CFNetwork/i.test(ua) ? "Mobile app" : "Browser";
  const os = /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

function toEntry(a: ApiAudit): AuditEntry {
  return {
    id: a.id, at: a.at, actorId: a.actor_id ?? "", actorName: a.actor_name ?? "—", actorRole: a.actor_role ?? "", ip: a.ip ?? "—", device: deviceOf(a.user_agent),
    action: categoryOf(a.action), actionText: humanize(a.action), targetType: TARGET[a.target_type] ?? null,
    target: [humanize(a.target_type), a.target_id ? a.target_id.slice(0, 8) : ""].filter(Boolean).join(" · "), reason: a.reason ?? "", diff: diffOf(a.before, a.after),
  };
}

const MAX_PAGES = 5;

/** Recent audit entries, newest first. `from` / `to` are `YYYY-MM-DD` and optional. */
export async function loadAudit(range: { from?: string; to?: string }): Promise<AuditEntry[]> {
  const out: AuditEntry[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res: { items: ApiAudit[]; next_cursor: string | null } = await api.get("/audit-logs", { params: { limit: 100, ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}), ...(cursor ? { cursor } : {}) } });
    out.push(...res.items.map(toEntry));
    cursor = res.next_cursor;
    if (!cursor) break;
  }
  return out;
}
