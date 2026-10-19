import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SCOPE } from "@/lib/permissions";
import { getOrg } from "@/lib/org";
import { isValidScope } from "@/lib/scope";
import type { Role, Scope } from "@/types/auth";

interface SessionState {
  role: Role;
  scope: Scope;
  sidebarCollapsed: boolean;
  setRole: (role: Role) => void;
  setScope: (scope: Scope) => void;
  toggleSidebar: () => void;
}

const ROLES: Role[] = ["admin", "branch", "site"];

/** Bump when the shape or meaning of persisted data changes. */
const VERSION = 2;

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      role: "admin",
      scope: DEFAULT_SCOPE.admin,
      sidebarCollapsed: false,
      setRole: (role) => set({ role, scope: DEFAULT_SCOPE[role] }),
      setScope: (scope) => set(isValidScope(get().role, scope, getOrg()) ? { scope } : {}),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "staffsync-session",
      version: VERSION,
      // Version 1 saved a "lyon" branch scope for the branch role, which has no Lyon sites.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<SessionState>;
        const role = ROLES.includes(old.role as Role) ? (old.role as Role) : "admin";
        return { role, scope: DEFAULT_SCOPE[role], sidebarCollapsed: !!old.sidebarCollapsed } as SessionState;
      },
      // Never keep a scope that would leave the role with nothing to show.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SessionState>;
        const role = ROLES.includes(saved.role as Role) ? (saved.role as Role) : current.role;
        const scope = saved.scope && isValidScope(role, saved.scope, getOrg()) ? saved.scope : DEFAULT_SCOPE[role];
        return { ...current, role, scope, sidebarCollapsed: saved.sidebarCollapsed ?? current.sidebarCollapsed };
      },
    },
  ),
);
