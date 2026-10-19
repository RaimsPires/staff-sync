import { BRANCHES, SITES } from "@/data/org";
import { DEFAULT_SCOPE, ROLE_SITES } from "@/lib/permissions";
import type { Role, Scope } from "@/types/auth";
import type { Site } from "@/types/domain";

function resolve(role: Role, scope: Scope): string[] {
  const allowed = ROLE_SITES[role];
  if (scope.kind === "company") return allowed;
  if (scope.kind === "branch") {
    const branch = BRANCHES.find((b) => b.id === scope.id);
    return (branch?.siteIds ?? []).filter((id) => allowed.includes(id));
  }
  return scope.id && allowed.includes(scope.id) ? [scope.id] : [];
}

/** Whether a scope is usable for a role, i.e. it resolves to at least one site. */
export const isValidScope = (role: Role, scope: Scope): boolean => resolve(role, scope).length > 0;

/**
 * Ids of the sites a role sees once the scope switcher narrows its access. A scope that no longer
 * matches the role (for example saved by an older version) falls back to the role's default scope
 * instead of producing empty screens.
 */
export function effectiveSiteIds(role: Role, scope: Scope): string[] {
  const ids = resolve(role, scope);
  return ids.length > 0 ? ids : resolve(role, DEFAULT_SCOPE[role]);
}

export const sitesIn = (ids: string[]): Site[] => SITES.filter((s) => ids.includes(s.id));
