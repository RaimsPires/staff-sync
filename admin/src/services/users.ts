import { api } from "@/lib/api";
import { fromBackendPerms, SCOPE_KIND, toBackendPerms } from "@/lib/access-catalog";
import { useAuth } from "@/store/auth";
import { usersRemote, useUsers } from "@/store/users";
import type { ScopeKind } from "@/types/auth";
import type { AccessRole, DashboardUser, RoleDraft, RoleScopeKey, UserStatus } from "@/types/users";

interface ApiRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  key: string | null;
  permissions: string[];
}

interface ApiUser {
  id: string;
  full_name: string;
  email: string | null;
  status: string;
  roles: { role_id: string; role: string; scope_type: string; scope_ids: string[] }[];
  last_active_at: string | null;
}

const SCOPE_TYPE: Record<ScopeKind, string> = { company: "company", branch: "branches", site: "sites" };
/** What a built-in role is scoped to by default. Custom roles take their scope when assigned. */
const SYSTEM_SCOPE: Record<string, RoleScopeKey> = { owner: "company", branch_admin: "branches", site_manager: "sites", viewer: "company", employee: "self" };

function toRole(r: ApiRole): AccessRole {
  const scopeKey = r.is_system && r.key ? (SYSTEM_SCOPE[r.key] ?? "company") : "company";
  return {
    id: r.id, key: r.key ?? undefined, builtIn: r.is_system, name: r.name, desc: r.description ?? "", scope: r.is_system ? SCOPE_KIND[scopeKey] : "any", scopeKey, scopeIds: [],
    perms: fromBackendPerms(r.permissions),
  };
}

function toUser(u: ApiUser, meId: string | undefined): DashboardUser {
  const role = u.roles[0];
  const type = role?.scope_type ?? "company";
  const kind: ScopeKind = type === "branches" || type === "branch_own" ? "branch" : type === "sites" || type === "site_own" ? "site" : "company";
  return {
    id: u.id, name: u.full_name, email: u.email ?? "", roleId: role?.role_id ?? "", scope: { kind, ids: role?.scope_ids ?? [] }, lastActive: u.last_active_at,
    status: (["active", "invited", "revoked"].includes(u.status) ? u.status : "active") as UserStatus, me: u.id === meId || undefined,
  };
}

/** Read the company's roles and dashboard users (what the signed-in user may manage). */
export async function loadUsers(): Promise<void> {
  const meId = useAuth.getState().me?.id;
  const [roles, users] = await Promise.all([api.get<ApiRole[]>("/roles").catch(() => null), api.get<ApiUser[]>("/users").catch(() => null)]);
  useUsers.setState((s) => ({
    roles: roles ? roles.filter((r) => r.key !== "employee").map(toRole) : s.roles,
    users: users ? users.map((u) => toUser(u, meId)) : s.users,
  }));
}

const titleCase = (s: string) => s.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const roleBody = (d: RoleDraft) => ({ name: d.name.trim(), description: d.desc.trim() || null, permissions: toBackendPerms(d.perms) });

export function installUsersRemote(): void {
  usersRemote.current = {
    async invite(email, roleId, scope) {
      await api.post("/users/invite", { email, full_name: titleCase(email.split("@")[0]), role_id: roleId, scope_type: SCOPE_TYPE[scope.kind], scope_ids: scope.ids });
      await loadUsers();
    },
    async assign(id, roleId, scope) {
      await api.patch(`/users/${id}/roles`, { role_id: roleId, scope_type: SCOPE_TYPE[scope.kind], scope_ids: scope.ids });
      await loadUsers();
    },
    async setStatus(id, status) {
      if (status === "revoked") await api.post(`/users/${id}/revoke`);
      else {
        // Revoking removes the role, so access comes back read-only; it can be changed afterwards.
        const roles = await api.get<ApiRole[]>("/roles");
        const base = roles.find((r) => r.key === "viewer") ?? roles.find((r) => r.key !== "employee");
        if (!base) throw new Error("No role available to restore access with");
        await api.post(`/users/${id}/restore`, { role_id: base.id, scope_type: "company", scope_ids: [] });
      }
      await loadUsers();
    },
    async resend(id) {
      await api.post(`/users/${id}/resend-invite`);
    },
    async saveRole(draft) {
      if (draft.id) await api.patch(`/roles/${draft.id}`, roleBody(draft));
      else await api.post("/roles", roleBody(draft));
      await loadUsers();
    },
    async deleteRole(id) {
      await api.delete(`/roles/${id}`, { data: { reason: "Removed from Users & roles" } });
      await loadUsers();
    },
    reload: loadUsers,
  };
}
