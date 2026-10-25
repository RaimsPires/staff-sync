import { api } from "@/lib/api";
import { loadLeaveTypes } from "@/services/leave";
import { settingsRemote, useSettings } from "@/store/settings";
import type { ApiKey, LeaveTypeDef, NotifEvent, NotifRule, SettingsValues, Webhook } from "@/types/settings";

// --- server <-> UI vocabulary -------------------------------------------------------------------------------

interface ApiCompany {
  name: string;
  timezone: string;
  locale: string;
}

interface ApiAttendance {
  grace_min: number;
  early_leave_tol_min: number;
  auto_checkout_time: string | null;
  min_accuracy_m: number;
  block_mock_location: boolean;
  default_require_selfie: boolean;
  default_require_qr: boolean;
  allow_offline: boolean;
  max_sync_delay_h: number;
}

type ApiNotification = { roles: string[]; channels: string[] };

const NOTIF_EVENT: Record<NotifEvent, string> = { fraud: "fraud_flag", noshow: "no_show", miss: "missing_checkout", lvnew: "leave_request", lvdec: "leave_decision", unc: "uncovered_intervention" };
const CHANNELS = ["in_app", "push", "email", "sms"] as const;
/** UI roles in column order: company admin, HR, branch manager, site manager, employee. */
const ROLES = ["owner", "viewer", "branch_admin", "site_manager", "employee"] as const;

const WEBHOOK_EVENT: Record<string, string> = {
  checkinFlagged: "attendance.flagged", checkinCreated: "attendance.checked_in", leaveRequested: "leave.requested", leaveApproved: "leave.approved", employeeDeactivated: "employee.deactivated",
};
const WEBHOOK_UI = Object.fromEntries(Object.entries(WEBHOOK_EVENT).map(([ui, api]) => [api, ui]));

const toRule = (n: ApiNotification | undefined): NotifRule => ({
  channels: CHANNELS.map((c) => !!n?.channels.includes(c)) as NotifRule["channels"],
  roles: ROLES.map((r) => !!n?.roles.includes(r)) as NotifRule["roles"],
});
const fromRule = (r: NotifRule): ApiNotification => ({ channels: CHANNELS.filter((_, i) => r.channels[i]), roles: ROLES.filter((_, i) => r.roles[i]) });

// --- loading ------------------------------------------------------------------------------------------------

/** Read the company's settings, API keys and webhooks into the settings store (the parts the user may see). */
export async function loadSettings(): Promise<void> {
  const [company, attendance, leave, notifications, keys, hooks] = await Promise.all([
    api.get<ApiCompany>("/company"),
    api.get<ApiAttendance>("/settings/attendance").catch(() => null),
    api.get<{ levels: number }>("/settings/leave-policy").catch(() => null),
    api.get<Record<string, ApiNotification>>("/settings/notifications").catch(() => null),
    api.get<{ id: string; name: string; prefix: string }[]>("/settings/api-keys").catch(() => null),
    api.get<{ id: string; url: string; events: string[]; active: boolean }[]>("/webhooks").catch(() => null),
  ]);
  const values: Partial<SettingsValues> = { name: company.name, tz: company.timezone, lang: company.locale === "fr" ? "fr" : "en" };
  if (attendance) {
    Object.assign(values, {
      grace: attendance.grace_min, early: attendance.early_leave_tol_min, autoOut: attendance.auto_checkout_time ?? "23:59", miss: attendance.auto_checkout_time ? "auto" : "flag",
      gps: attendance.min_accuracy_m, mock: attendance.block_mock_location, selfie: attendance.default_require_selfie, qr: attendance.default_require_qr, offline: attendance.allow_offline, sync: attendance.max_sync_delay_h,
    });
  }
  if (leave) values.wf = leave.levels === 2 ? "two" : "one";
  if (notifications) {
    const current = useSettings.getState().values.notif;
    values.notif = Object.fromEntries((Object.keys(NOTIF_EVENT) as NotifEvent[]).map((id) => [id, notifications[NOTIF_EVENT[id]] ? toRule(notifications[NOTIF_EVENT[id]]) : current[id]])) as SettingsValues["notif"];
  }
  useSettings.setState((s) => ({
    values: { ...s.values, ...values },
    ...(keys ? { keys: keys.map<ApiKey>((k) => ({ id: k.id, name: k.name, prefix: `${k.prefix}…`, created: "seed" })) } : {}),
    ...(hooks ? { hooks: hooks.map<Webhook>((h) => ({ id: h.id, url: h.url, events: h.events.map((e) => WEBHOOK_UI[e]).filter(Boolean), on: h.active })) } : {}),
  }));
}

// --- writing ------------------------------------------------------------------------------------------------

/** Send the changed UI settings to the sections that own them. */
async function pushValues(p: Partial<SettingsValues>): Promise<void> {
  const company: Record<string, unknown> = {};
  if (p.name !== undefined) company.name = p.name;
  if (p.tz !== undefined) company.timezone = p.tz;
  if (p.lang !== undefined) company.locale = p.lang;
  const attendance: Record<string, unknown> = {};
  if (p.grace !== undefined) attendance.grace_min = p.grace;
  if (p.early !== undefined) attendance.early_leave_tol_min = p.early;
  if (p.gps !== undefined) attendance.min_accuracy_m = p.gps;
  if (p.mock !== undefined) attendance.block_mock_location = p.mock;
  if (p.selfie !== undefined) attendance.default_require_selfie = p.selfie;
  if (p.qr !== undefined) attendance.default_require_qr = p.qr;
  if (p.offline !== undefined) attendance.allow_offline = p.offline;
  if (p.sync !== undefined) attendance.max_sync_delay_h = p.sync;
  if (p.miss !== undefined || p.autoOut !== undefined) {
    const s = useSettings.getState().values;
    // The server has one switch: close open shifts at a time ("auto") or leave them for review. "Ignore" is kept as review.
    attendance.auto_checkout_time = (p.miss ?? s.miss) === "auto" ? (p.autoOut ?? s.autoOut) : null;
  }
  const jobs: Promise<unknown>[] = [];
  if (Object.keys(company).length) jobs.push(api.patch("/company", company));
  if (Object.keys(attendance).length) jobs.push(api.patch("/settings/attendance", attendance));
  if (p.wf !== undefined) jobs.push(api.patch("/settings/leave-policy", { levels: p.wf === "two" ? 2 : 1 }));
  if (p.notif) jobs.push(api.patch("/settings/notifications", Object.fromEntries((Object.keys(NOTIF_EVENT) as NotifEvent[]).filter((id) => p.notif?.[id]).map((id) => [NOTIF_EVENT[id], fromRule(p.notif![id])]))));
  await Promise.all(jobs);
}

const leaveTypeBody = (t: Omit<LeaveTypeDef, "id" | "builtIn">) => ({
  name_en: t.name ?? "", name_fr: t.name ?? "", color: t.color, paid: t.paid, yearly_allowance: t.allowance, requires_document: t.document, min_notice_days: t.notice, half_day_allowed: t.half, carry_over_max: t.carry,
});

export function installSettingsRemote(): void {
  settingsRemote.current = {
    patch: pushValues,

    async saveLeaveType({ id, ...rest }) {
      if (!rest.name) throw new Error("A leave type needs a name");
      if (id) await api.patch(`/leave/types/${id}`, leaveTypeBody(rest));
      else await api.post("/leave/types", leaveTypeBody(rest));
      await loadLeaveTypes();
    },
    async deleteLeaveType(id) {
      await api.delete(`/leave/types/${id}`, { data: { reason: "Removed from Settings" } });
      await loadLeaveTypes();
    },

    async createKey(name) {
      const out = await api.post<{ key: string }>("/settings/api-keys", { name });
      await loadSettings();
      return out.key;
    },
    async revokeKey(id) {
      await api.delete(`/settings/api-keys/${id}`);
    },

    async addHook(url, events) {
      const mapped = events.map((e) => WEBHOOK_EVENT[e]).filter(Boolean);
      if (!mapped.length) throw new Error("Pick at least one supported event");
      const out = await api.post<{ secret: string }>("/webhooks", { url, events: mapped, active: true });
      await loadSettings();
      return out.secret;
    },
    async toggleHook(id, on) {
      await api.patch(`/webhooks/${id}`, { active: on });
    },
    async deleteHook(id) {
      await api.delete(`/webhooks/${id}`);
    },

    reload: loadSettings,
  };
}
