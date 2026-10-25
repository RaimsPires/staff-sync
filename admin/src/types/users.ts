import type { ScopeKind } from "./auth";

export type UserStatus = "active" | "invited" | "revoked";

/** How an access role limits the data a user can see. */
export type RoleScopeKey = "company" | "branches" | "ownBranch" | "sites" | "ownSite" | "self";

/** Which scope kinds a role allows when it is assigned: a fixed kind, or "any" to let the assigner pick. */
export type RoleScopeKind = ScopeKind | "any";

export interface AccessRole {
  id: string;
  /** Server key of a built-in role (owner, branch_admin, site_manager, viewer, employee). */
  key?: string;
  /** Built-in roles are translated and read-only; custom roles carry their own text. */
  builtIn: boolean;
  name: string;
  desc: string;
  /** What kind of scope picker an assignment needs. */
  scope: RoleScopeKind;
  scopeKey: RoleScopeKey;
  /** Branch ids (scopeKey "branches") or site ids (scopeKey "sites"). */
  scopeIds: string[];
  perms: string[];
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  scope: { kind: ScopeKind; ids: string[] };
  /** ISO datetime of the last sign-in; null when they never signed in. */
  lastActive: string | null;
  status: UserStatus;
  me?: boolean;
}

export interface RoleDraft {
  id: string | null;
  name: string;
  desc: string;
  perms: string[];
  scopeKey: RoleScopeKey;
  scopeIds: string[];
}
