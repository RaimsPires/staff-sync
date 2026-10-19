import type { RoleScopeKey, RoleScopeKind } from "@/types/users";

export const PERM_ACTIONS = ["view", "create", "edit", "delete", "approve"] as const;
export type PermAction = (typeof PERM_ACTIONS)[number];

/** Every permissioned module and the actions that make sense for it. */
export const MODULES = [
  { key: "att", actions: ["view", "create", "edit", "delete"] },
  { key: "proxy", actions: ["view", "create"] },
  { key: "fraud", actions: ["view", "approve"] },
  { key: "emp", actions: ["view", "create", "edit", "delete"] },
  { key: "site", actions: ["view", "create", "edit", "delete"] },
  { key: "branch", actions: ["view", "create", "edit", "delete"] },
  { key: "sch", actions: ["view", "create", "edit", "delete"] },
  { key: "lva", actions: ["view", "approve"] },
  { key: "lvs", actions: ["view", "edit"] },
  { key: "rep", actions: ["view"] },
  { key: "exp", actions: ["create"] },
  { key: "usr", actions: ["view", "create", "edit", "delete"] },
  { key: "audit", actions: ["view"] },
  { key: "set", actions: ["view", "edit"] },
  { key: "bill", actions: ["view", "edit"] },
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
  { key: "users", allowed: (h) => h("usr.view") },
  { key: "audit", allowed: (h) => h("audit.view") },
  { key: "settings", allowed: (h) => h("set.view") || h("bill.view") },
];

/** Plain-language abilities shown in the role preview. */
export const CAN_KEYS = ["att.edit", "proxy.create", "fraud.approve", "emp.create", "sch.edit", "lva.approve", "exp.create", "usr.edit", "set.edit", "bill.view"] as const;
export const CANT_KEYS = ["usr.edit", "set.edit", "bill.view"] as const;
