import type { RoleScopeKey, RoleScopeKind } from "@/types/users";

export const PERM_ACTIONS = ["view", "create", "edit", "delete", "approve"] as const;
export type PermAction = (typeof PERM_ACTIONS)[number];

/**
 * Every permissioned module and the actions the server can grant for it. "edit" covers creating, changing and deleting
 * (the server has one "manage" permission per area); "approve" is the decision permission.
 */
export const MODULES = [
  { key: "att", actions: ["view", "edit"] },
  { key: "proxy", actions: ["create"] },
  { key: "fraud", actions: ["view", "approve"] },
  { key: "emp", actions: ["view", "edit"] },
  { key: "site", actions: ["view", "edit"] },
  { key: "branch", actions: ["view", "edit"] },
  { key: "sch", actions: ["view", "edit"] },
  { key: "lva", actions: ["view", "approve"] },
  { key: "lvs", actions: ["edit"] },
  { key: "rep", actions: ["view"] },
  { key: "exp", actions: ["create"] },
  { key: "usr", actions: ["edit"] },
  { key: "audit", actions: ["view"] },
  { key: "set", actions: ["edit"] },
  { key: "bill", actions: ["edit"] },
  { key: "chat", actions: ["edit"] },
] as const satisfies readonly { key: string; actions: readonly PermAction[] }[];

export type ModuleKey = (typeof MODULES)[number]["key"];

export const ALL_PERMISSIONS: string[] = MODULES.flatMap((m) => m.actions.map((a) => `${m.key}.${a}`));

/** Builds a permission list from `module: actions` pairs. */
export const grant = (spec: Partial<Record<ModuleKey, readonly PermAction[]>>): string[] =>
  Object.entries(spec).flatMap(([m, actions]) => (actions ?? []).map((a) => `${m}.${a}`));

export const ROLE_SCOPES: RoleScopeKey[] = ["company", "branches", "ownBranch", "sites", "ownSite", "self"];

/** Which kind of picker a role scope needs when assigned to a user. */
export const SCOPE_KIND: Record<RoleScopeKey, RoleScopeKind> = {
  company: "company", branches: "branch", ownBranch: "branch", sites: "site", ownSite: "site", self: "company",
};

/** The server permissions behind each permission id here (a role has the id when it has all of them). */
export const BACKEND_PERMS: Record<string, string[]> = {
  "att.view": ["attendance.view"], "att.edit": ["attendance.edit"], "proxy.create": ["attendance.proxy_checkin"],
  "fraud.view": ["alerts.view"], "fraud.approve": ["alerts.resolve"],
  "emp.view": ["employees.view"], "emp.edit": ["employees.manage", "devices.reset"],
  "site.view": ["sites.view"], "site.edit": ["sites.manage"], "branch.view": ["branches.view"], "branch.edit": ["branches.manage"],
  "sch.view": ["schedules.view"], "sch.edit": ["schedules.manage"],
  "lva.view": ["leave.view"], "lva.approve": ["leave.approve", "leave.recommend"], "lvs.edit": ["leave.settings"],
  "rep.view": ["reports.view"], "exp.create": ["reports.export"],
  "usr.edit": ["users.manage", "roles.manage"], "audit.view": ["audit.view"], "set.edit": ["settings.manage"], "bill.edit": ["billing.manage"], "chat.edit": ["chat.sites"],
};

/** Permission ids -> the server permissions to store. */
export const toBackendPerms = (ids: string[]): string[] => [...new Set(ids.flatMap((id) => BACKEND_PERMS[id] ?? []))];

/** Server permissions -> the permission ids a role has (server permissions with no counterpart here are ignored). */
export const fromBackendPerms = (perms: string[]): string[] => ALL_PERMISSIONS.filter((id) => (BACKEND_PERMS[id] ?? []).length > 0 && BACKEND_PERMS[id].every((p) => perms.includes(p)));

/** Sidebar entries a permission set unlocks, in sidebar order. */
export const NAV_RULES: { key: string; allowed: (has: (p: string) => boolean) => boolean }[] = [
  { key: "overview", allowed: () => true },
  { key: "live", allowed: (h) => h("att.view") },
  { key: "alerts", allowed: (h) => h("fraud.view") },
  { key: "attendance", allowed: (h) => h("att.view") },
  { key: "employees", allowed: (h) => h("emp.view") },
  { key: "sites", allowed: (h) => h("site.view") || h("branch.view") },
  { key: "schedules", allowed: (h) => h("sch.view") },
  { key: "leave", allowed: (h) => h("lva.view") },
  { key: "reports", allowed: (h) => h("rep.view") },
  { key: "users", allowed: (h) => h("usr.edit") },
  { key: "chat", allowed: () => true },
  { key: "audit", allowed: (h) => h("audit.view") },
  { key: "settings", allowed: (h) => h("set.edit") || h("bill.edit") },
];

/** Plain-language abilities shown in the role preview. */
export const CAN_KEYS = ["att.edit", "proxy.create", "fraud.approve", "emp.edit", "sch.edit", "lva.approve", "exp.create", "usr.edit", "set.edit", "bill.edit"] as const;
export const CANT_KEYS = ["usr.edit", "set.edit", "bill.edit"] as const;
