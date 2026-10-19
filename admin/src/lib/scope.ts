import type { Org } from "@/lib/org";
import { DEFAULT_SCOPE, ROLE_BRANCH, ROLE_SITE } from "@/lib/permissions";
import type { Role, Scope } from "@/types/auth";
import type { Site } from "@/types/domain";

/** Ids of the sites a role may ever see. The scope switcher narrows within this list. */
export function roleSiteIds(role: Role, org: Org): string[] {
  if (role === "admin") return org.sites.map((s) => s.id);
  if (role === "branch") return org.sites.filter((s) => s.branchId === ROLE_BRANCH).map((s) => s.id);
  return org.sites.filter((s) => s.id === ROLE_SITE).map((s) => s.id);
}

function resolve(role: Role, scope: Scope, org: Org): string[] {
  const allowed = roleSiteIds(role, org);
  if (scope.kind === "company") return allowed;
  if (scope.kind === "branch") {
    const branch = org.branches.find((b) => b.id === scope.id);
    return (branch?.siteIds ?? []).filter((id) => allowed.includes(id));
  }
  return scope.id && allowed.includes(scope.id) ? [scope.id] : [];
}

/** Whether a scope is usable for a role, i.e. it resolves to at least one site. */
export const isValidScope = (role: Role, scope: Scope, org: Org): boolean => resolve(role, scope, org).length > 0;

/**
 * Ids of the sites a role sees once the scope switcher narrows its access. A scope that no longer
 * matches the role (for example saved by an older version) falls back to the role's default scope
 * instead of producing empty screens.
 */
export function effectiveSiteIds(role: Role, scope: Scope, org: Org): string[] {
  const ids = resolve(role, scope, org);
  return ids.length > 0 ? ids : resolve(role, DEFAULT_SCOPE[role], org);
}

export const sitesIn = (ids: string[], org: Org): Site[] => org.sites.filter((s) => ids.includes(s.id));
