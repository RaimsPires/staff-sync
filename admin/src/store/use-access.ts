import { useMemo } from "react";
import { useOrg } from "@/lib/org";
import { effectiveSiteIds } from "@/lib/scope";
import { DEFAULT_SCOPE, IDENTITY, permissionsFor, permissionsFromList } from "@/lib/permissions";
import { useHydrated } from "@/lib/use-hydrated";
import { usePreview } from "@/store/preview";
import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";

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
  const org = useOrg();
  const siteIds = useMemo(() => effectiveSiteIds(role, scope, org), [role, scope, org]);
  const previewId = usePreview((s) => s.roleId);
  const previewRole = useUsers((s) => s.roles.find((r) => r.id === previewId));
  // Previewing a role swaps the permissions only; the data scope stays the signed-in user's.
  const perms = previewRole ? permissionsFromList(previewRole.perms, previewRole.id === "admin") : permissionsFor(role);
  return { hydrated, role, scope, siteIds, perms, me: IDENTITY[role], previewRole: previewRole ?? null };
}
