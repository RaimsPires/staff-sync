import { create } from "zustand";
import { SEED_ROLES, SEED_USERS } from "@/data/users";
import { SCOPE_KIND } from "@/lib/access-catalog";
import { useSyncError } from "@/store/sync-error";
import type { AccessRole, DashboardUser, RoleDraft } from "@/types/users";

/** Persistence behind the store, installed once the user is signed in (see `services/users`). */
export interface UsersRemote {
  invite: (email: string, roleId: string, scope: DashboardUser["scope"]) => Promise<void>;
  assign: (id: string, roleId: string, scope: DashboardUser["scope"]) => Promise<void>;
  setStatus: (id: string, status: DashboardUser["status"]) => Promise<void>;
  resend: (id: string) => Promise<void>;
  saveRole: (draft: RoleDraft) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}
export const usersRemote: { current: UsersRemote | null } = { current: null };

/** Run a server change in the background; when it fails, say why and reload the real state. */
function sync(send: (r: UsersRemote) => Promise<void>) {
  const remote = usersRemote.current;
  if (!remote) return;
  send(remote).catch((e: unknown) => {
    useSyncError.getState().report(e instanceof Error ? e.message : "Couldn’t save the change");
    void remote.reload();
  });
}

interface UsersState {
  users: DashboardUser[];
  roles: AccessRole[];
  /** Resolves once the server accepted the change (rejects with its message). */
  invite: (email: string, roleId: string, scope: DashboardUser["scope"]) => Promise<void>;
  assign: (id: string, roleId: string, scope: DashboardUser["scope"]) => Promise<void>;
  setStatus: (id: string, status: DashboardUser["status"]) => void;
  /** Send the invitation link again; rejects with the server's message. */
  resend: (id: string) => Promise<void>;
  saveRole: (draft: RoleDraft) => Promise<void>;
  deleteRole: (id: string) => void;
}

const titleCase = (s: string) => s.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const useUsers = create<UsersState>((set) => ({
  users: SEED_USERS,
  roles: SEED_ROLES,
  invite: async (email, roleId, scope) => {
    const remote = usersRemote.current;
    if (remote) return remote.invite(email, roleId, scope);
    const user: DashboardUser = { id: `u${Date.now()}`, name: titleCase(email.split("@")[0]), email, roleId, scope, lastActive: null, status: "invited" };
    set((s) => ({ users: [...s.users, user] }));
  },
  assign: async (id, roleId, scope) => {
    const remote = usersRemote.current;
    if (remote) return remote.assign(id, roleId, scope);
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, roleId, scope } : u)) }));
  },
  setStatus: (id, status) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status, lastActive: status === "active" ? null : u.lastActive } : u)) }));
    sync((r) => r.setStatus(id, status));
  },
  resend: async (id) => {
    await usersRemote.current?.resend(id);
  },
  saveRole: async (d) => {
    const remote = usersRemote.current;
    if (remote) return remote.saveRole(d);
    set((s) => {
      const kind = SCOPE_KIND[d.scopeKey];
      const data = { name: d.name, desc: d.desc, perms: d.perms, scopeKey: d.scopeKey, scopeIds: d.scopeIds, scope: kind };
      if (d.id) return { roles: s.roles.map((r) => (r.id === d.id ? { ...r, ...data } : r)) };
      return { roles: [...s.roles, { id: `c${Date.now()}`, builtIn: false, ...data }] };
    });
  },
  deleteRole: (id) => {
    set((s) => ({ roles: s.roles.filter((r) => r.id !== id) }));
    sync((r) => r.deleteRole(id));
  },
}));

const isOwner = (roles: AccessRole[], roleId: string) => roles.find((r) => r.id === roleId)?.key === "owner";
export const activeAdmins = (users: DashboardUser[], roles: AccessRole[]) => users.filter((u) => isOwner(roles, u.roleId) && u.status !== "revoked");
export const isOwnerRole = isOwner;
export const usersOfRole = (users: DashboardUser[], roleId: string) => users.filter((u) => u.roleId === roleId && u.status !== "revoked").length;
