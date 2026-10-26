import { COMPANY_NAME } from "@/data/org";
import type { ApiKey, LeaveTypeDef, NotifEvent, NotifRule, SettingsValues, Webhook } from "@/types/settings";

export const NOTIF_EVENTS: NotifEvent[] = ["fraud", "noshow", "miss", "lvnew", "lvdec", "unc"];
export const NOTIF_CHANNELS = ["inApp", "push", "email", "sms"] as const;
export const NOTIF_ROLES = ["admin", "hr", "branch", "site", "employee"] as const;

const rule = (c: number[], r: number[]): NotifRule => ({
  channels: c.map(Boolean) as NotifRule["channels"], roles: r.map(Boolean) as NotifRule["roles"],
});

export const DEFAULT_SETTINGS: SettingsValues = {
  name: COMPANY_NAME, addr: "12 Rue de la Part-Dieu, 69003 Lyon", tz: "Europe/Paris", lang: "en", dfmt: "DD/MM/YYYY", tfmt: "24h", wk: "monday",
  grace: 10, early: 5, autoOut: "23:59", miss: "flag", ot: "daily8", otApp: true, gps: 50, mock: true, selfie: false, qr: true, offline: true, sync: 24,
  wf: "two", hLyon: "fr", hParis: "fr", hMrs: "fr",
  pay: "silae", paySplit: true, sso: "none", ssoDom: "", ssoUrl: "", ssoForce: false,
  notif: {
    fraud: rule([1, 1, 1, 0], [1, 0, 0, 1, 0]), noshow: rule([1, 1, 0, 0], [0, 0, 1, 1, 0]), miss: rule([1, 0, 1, 0], [0, 1, 1, 1, 0]),
    lvnew: rule([1, 1, 1, 0], [0, 1, 1, 0, 0]), lvdec: rule([1, 1, 1, 0], [0, 0, 0, 0, 1]), unc: rule([1, 1, 1, 1], [1, 0, 1, 1, 0]),
  },
};

export const SEED_LEAVE_TYPES: LeaveTypeDef[] = [
  { id: "annual", name: null, builtIn: true, color: "#2F7DF0", paid: true, allowance: 25, document: false, notice: 14, half: true, carry: 5 },
  { id: "rtt", name: null, builtIn: true, color: "#7C5CE6", paid: true, allowance: 10, document: false, notice: 7, half: true, carry: 0 },
  { id: "sick", name: null, builtIn: true, color: "#E07A2E", paid: true, allowance: 5, document: true, notice: 0, half: false, carry: 0 },
  { id: "family", name: null, builtIn: true, color: "#2F9E6B", paid: true, allowance: 4, document: true, notice: 3, half: true, carry: 0 },
  { id: "unpaid", name: null, builtIn: true, color: "#6F7A8B", paid: false, allowance: 0, document: false, notice: 14, half: false, carry: 0 },
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

