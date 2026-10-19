import { useMemo } from "react";
import { effectiveSiteIds } from "@/lib/scope";
import { DEFAULT_SCOPE, IDENTITY, permissionsFor } from "@/lib/permissions";
import { useHydrated } from "@/lib/use-hydrated";
import { useSession } from "@/store/session";

/**
 * What the signed-in user may see: role, permissions, scope and the resulting site ids.
 * Until the persisted session is read on the client it falls back to the default admin so
 * server and client render the same markup.
 */
export function useAccess() {
  const hydrated = useHydrated();
  const storedRole = useSession((s) => s.role);
  const storedScope = useSession((s) => s.scope);
  const role = hydrated ? storedRole : "admin";
  const scope = hydrated ? storedScope : DEFAULT_SCOPE.admin;
  const siteIds = useMemo(() => effectiveSiteIds(role, scope), [role, scope]);
  return { hydrated, role, scope, siteIds, perms: permissionsFor(role), me: IDENTITY[role] };
}
