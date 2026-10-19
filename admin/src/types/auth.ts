export type Role = "admin" | "branch" | "site";

export type ScopeKind = "company" | "branch" | "site";

/** Where a user's data access applies: the whole company, one branch, or one site. */
export interface Scope {
  kind: ScopeKind;
  /** Branch or site id; absent for the whole company. */
  id?: string;
}

export interface Permissions {
  /** Super admin: everything, including billing and roles. */
  admin: boolean;
  /** Edit attendance records. */
  edit: boolean;
  /** Check in or out on behalf of employees. */
  behalf: boolean;
  /** Review and decide on flagged check-ins. */
  review: boolean;
  /** Approve or reject leave requests. */
  approve: boolean;
  /** Manage branches and sites. */
  org: boolean;
  reports: boolean;
  users: boolean;
  settings: boolean;
  audit: boolean;
}

export type AdminPage =
  | "dashboard"
  | "live"
  | "attendance"
  | "alerts"
  | "employees"
  | "sites"
  | "schedules"
  | "leave"
  | "reports"
  | "users"
  | "audit"
  | "settings"
  | "profile";

/** The signed-in person as shown in menus. */
export interface Identity {
  name: string;
  email: string;
}
