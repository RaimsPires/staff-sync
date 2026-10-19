export type NotifEvent = "fraud" | "noshow" | "miss" | "lvnew" | "lvdec" | "unc";
export type NotifRole = "admin" | "hr" | "branch" | "site" | "employee";

export interface NotifRule {
  /** In-app, push, email, SMS. */
  channels: [boolean, boolean, boolean, boolean];
  /** Company admin, HR, branch manager, site manager, employee. */
  roles: [boolean, boolean, boolean, boolean, boolean];
}

export interface SettingsValues {
  name: string; addr: string; tz: string; lang: "en" | "fr"; dfmt: string; tfmt: "24h" | "12h"; wk: "monday" | "sunday" | "saturday";
  grace: number; early: number; autoOut: string; miss: "flag" | "auto" | "ignore"; ot: "daily8" | "weekly40" | "approval"; otApp: boolean;
  gps: number; mock: boolean; selfie: boolean; qr: boolean; offline: boolean; sync: number;
  wf: "one" | "two"; hLyon: string; hParis: string; hMrs: string;
  pay: "silae" | "payfit" | "adp" | "csv" | "xlsx"; paySplit: boolean; sso: "none" | "google" | "entra" | "saml"; ssoDom: string; ssoUrl: string; ssoForce: boolean;
  notif: Record<NotifEvent, NotifRule>;
}

export interface LeaveTypeDef {
  id: string; name: string; color: string; paid: boolean; allowance: number; document: boolean; notice: number; half: boolean; carry: number;
}

export interface ApiKey { id: string; name: string; prefix: string; created: "seed" | "now" }
export interface Webhook { id: string; url: string; events: string[]; on: boolean }
export type PlanId = "starter" | "growth" | "scale";
