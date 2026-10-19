import { create } from "zustand";
import { SEED_ROLES, SEED_USERS } from "@/data/users";
import { SCOPE_KIND } from "@/lib/access-catalog";
import type { AccessRole, DashboardUser, RoleDraft } from "@/types/users";

interface UsersState {
  users: DashboardUser[];
  roles: AccessRole[];
  invite: (email: string, roleId: string, scope: DashboardUser["scope"]) => DashboardUser;
  assign: (id: string, roleId: string, scope: DashboardUser["scope"]) => void;
  setStatus: (id: string, status: DashboardUser["status"]) => void;
  saveRole: (draft: RoleDraft) => void;
  deleteRole: (id: string) => void;
}

const titleCase = (s: string) => s.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const useUsers = create<UsersState>((set) => ({
  users: SEED_USERS,
  roles: SEED_ROLES,
  invite: (email, roleId, scope) => {
    const user: DashboardUser = { id: `u${Date.now()}`, name: titleCase(email.split("@")[0]), email, roleId, scope, lastActive: null, status: "invited" };
    set((s) => ({ users: [...s.users, user] }));
    return user;
  },
  assign: (id, roleId, scope) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, roleId, scope } : u)) })),
  setStatus: (id, status) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status, lastActive: status === "active" ? null : u.lastActive } : u)) })),
  saveRole: (d) =>
    set((s) => {
      const kind = SCOPE_KIND[d.scopeKey];
      const data = { name: d.name, desc: d.desc, perms: d.perms, scopeKey: d.scopeKey, scopeIds: d.scopeIds, scope: kind };
      if (d.id) return { roles: s.roles.map((r) => (r.id === d.id ? { ...r, ...data } : r)) };
      return { roles: [...s.roles, { id: `c${Date.now()}`, builtIn: false, ...data }] };
    }),
  deleteRole: (id) => set((s) => ({ roles: s.roles.filter((r) => r.id !== id) })),
}));

export const activeAdmins = (users: DashboardUser[]) => users.filter((u) => u.roleId === "admin" && u.status !== "revoked");
export const usersOfRole = (users: DashboardUser[], roleId: string) => users.filter((u) => u.roleId === roleId && u.status !== "revoked").length;
