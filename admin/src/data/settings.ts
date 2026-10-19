import type { ApiKey, LeaveTypeDef, NotifEvent, NotifRule, PlanId, SettingsValues, Webhook } from "@/types/settings";

export const NOTIF_EVENTS: NotifEvent[] = ["fraud", "noshow", "miss", "lvnew", "lvdec", "unc"];
export const NOTIF_CHANNELS = ["inApp", "push", "email", "sms"] as const;
export const NOTIF_ROLES = ["admin", "hr", "branch", "site", "employee"] as const;

const rule = (c: number[], r: number[]): NotifRule => ({
  channels: c.map(Boolean) as NotifRule["channels"], roles: r.map(Boolean) as NotifRule["roles"],
});

export const DEFAULT_SETTINGS: SettingsValues = {
  name: "Acme Facility Services", addr: "12 Rue de la Part-Dieu, 69003 Lyon", tz: "Europe/Paris", lang: "en", dfmt: "DD/MM/YYYY", tfmt: "24h", wk: "monday",
  grace: 10, early: 5, autoOut: "23:59", miss: "flag", ot: "daily8", otApp: true, gps: 50, mock: true, selfie: false, qr: true, offline: true, sync: 24,
  wf: "two", hLyon: "fr", hParis: "fr", hMrs: "fr",
  pay: "silae", paySplit: true, sso: "none", ssoDom: "", ssoUrl: "", ssoForce: false,
  notif: {
    fraud: rule([1, 1, 1, 0], [1, 0, 0, 1, 0]), noshow: rule([1, 1, 0, 0], [0, 0, 1, 1, 0]), miss: rule([1, 0, 1, 0], [0, 1, 1, 1, 0]),
    lvnew: rule([1, 1, 1, 0], [0, 1, 1, 0, 0]), lvdec: rule([1, 1, 1, 0], [0, 0, 0, 0, 1]), unc: rule([1, 1, 1, 1], [1, 0, 1, 1, 0]),
  },
};

export const SEED_LEAVE_TYPES: LeaveTypeDef[] = [
  { id: "t1", name: "Annual leave", color: "#2F7DF0", paid: true, allowance: 25, document: false, notice: 14, half: true, carry: 5 },
  { id: "t2", name: "RTT", color: "#7C5CE6", paid: true, allowance: 10, document: false, notice: 7, half: true, carry: 0 },
  { id: "t3", name: "Sick leave", color: "#E07A2E", paid: true, allowance: 5, document: true, notice: 0, half: false, carry: 0 },
  { id: "t4", name: "Family event", color: "#2F9E6B", paid: true, allowance: 4, document: true, notice: 3, half: true, carry: 0 },
  { id: "t5", name: "Unpaid leave", color: "#6F7A8B", paid: false, allowance: 0, document: false, notice: 14, half: false, carry: 0 },
];

export const TYPE_COLORS = ["#2F7DF0", "#7C5CE6", "#E07A2E", "#2F9E6B", "#D4A017", "#6F7A8B"] as const;

export const SEED_KEYS: ApiKey[] = [{ id: "k1", name: "Payroll sync", prefix: "ss_live_9f3k…", created: "seed" }];
export const SEED_HOOKS: Webhook[] = [{ id: "h1", url: "https://payroll.acme.fr/hooks/staffsync", events: ["checkinFlagged", "leaveApproved"], on: true }];
export const WEBHOOK_EVENTS = ["checkinFlagged", "checkinCreated", "leaveRequested", "leaveApproved", "employeeDeactivated", "schedulePublished"] as const;

export const TIMEZONES = [
  { value: "Europe/Paris", label: "Europe/Paris (UTC+1/+2)" }, { value: "Europe/London", label: "Europe/London (UTC+0/+1)" },
  { value: "Europe/Brussels", label: "Europe/Brussels (UTC+1/+2)" }, { value: "Europe/Madrid", label: "Europe/Madrid (UTC+1/+2)" },
];
export const DATE_FORMATS = [{ value: "DD/MM/YYYY", label: "31/12/2026" }, { value: "MM/DD/YYYY", label: "12/31/2026" }, { value: "YYYY-MM-DD", label: "2026-12-31" }];

export const PLANS: { id: PlanId; price: number; cap: number }[] = [
  { id: "starter", price: 3, cap: 10 }, { id: "growth", price: 4, cap: 20 }, { id: "scale", price: 5, cap: 100 },
];
/** Seats in use today. */
export const SEATS_USED = 19;

export const INVOICES = [
  { id: "INV-2026-10", date: "2026-10-01", amount: 76 }, { id: "INV-2026-09", date: "2026-09-01", amount: 76 }, { id: "INV-2026-08", date: "2026-08-01", amount: 72 },
  { id: "INV-2026-07", date: "2026-07-01", amount: 68 }, { id: "INV-2026-06", date: "2026-06-01", amount: 64 },
];
