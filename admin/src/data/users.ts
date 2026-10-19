import { ALL_PERMISSIONS, grant } from "@/lib/access-catalog";
import type { AccessRole, DashboardUser } from "@/types/users";

export const SEED_ROLES: AccessRole[] = [
  { id: "admin", builtIn: true, name: "Company admin", desc: "Full access to every branch, site and setting, including users and billing.", scope: "company", scopeKey: "company", scopeIds: [], perms: ALL_PERMISSIONS },
  {
    id: "hr", builtIn: true, name: "HR manager", desc: "Manages people, leave and attendance across the company. No user administration.", scope: "company", scopeKey: "company", scopeIds: [],
    perms: grant({ att: ["view", "create", "edit"], fraud: ["view", "approve"], emp: ["view", "create", "edit"], site: ["view"], branch: ["view"], sch: ["view", "create", "edit"], lva: ["view", "approve"], lvs: ["view"], rep: ["view"], exp: ["create"], audit: ["view"] }),
  },
  {
    id: "branch", builtIn: true, name: "Branch manager", desc: "Runs one or more branches: schedules, approvals, employees and sites inside their scope.", scope: "branch", scopeKey: "ownBranch", scopeIds: [],
    perms: grant({ att: ["view", "create", "edit"], proxy: ["view", "create"], fraud: ["view", "approve"], emp: ["view", "create", "edit"], site: ["view"], sch: ["view", "create", "edit"], lva: ["view", "approve"], rep: ["view"], exp: ["create"] }),
  },
  {
    id: "site", builtIn: true, name: "Site manager", desc: "Handles daily operations on assigned sites, including proxy check-ins.", scope: "site", scopeKey: "ownSite", scopeIds: [],
    perms: grant({ att: ["view"], proxy: ["view", "create"], emp: ["view"], site: ["view"], sch: ["view"], lva: ["view"] }),
  },
  {
    id: "viewer", builtIn: true, name: "Read-only viewer", desc: "Can see data within their scope but cannot change anything.", scope: "any", scopeKey: "branches", scopeIds: ["lyon", "pn", "mrs"],
    perms: grant({ att: ["view"], emp: ["view"], site: ["view"], branch: ["view"], sch: ["view"], lva: ["view"], rep: ["view"] }),
  },
  {
    id: "payroll", builtIn: false, name: "Payroll officer", desc: "Reads timesheets and reports for payroll runs across the company.", scope: "company", scopeKey: "company", scopeIds: [],
    perms: grant({ att: ["view"], emp: ["view"], lva: ["view"], rep: ["view"], exp: ["create"] }),
  },
];

const company = { kind: "company" as const, ids: [] };

export const SEED_USERS: DashboardUser[] = [
  { id: "u1", name: "Claire Vasseur", email: "claire.vasseur@staffsync.io", roleId: "admin", scope: company, lastActive: "2026-10-15T10:00", status: "active", me: true },
  { id: "u2", name: "Julien Roche", email: "julien.roche@staffsync.io", roleId: "admin", scope: company, lastActive: "2026-10-15T09:41", status: "active" },
  { id: "u3", name: "Marc Olivier", email: "marc.olivier@staffsync.io", roleId: "branch", scope: { kind: "branch", ids: ["pn"] }, lastActive: "2026-10-15T08:12", status: "active" },
  { id: "u4", name: "Nadia Koné", email: "nadia.kone@staffsync.io", roleId: "branch", scope: { kind: "branch", ids: ["lyon", "mrs"] }, lastActive: "2026-10-14T17:30", status: "active" },
  { id: "u5", name: "Sarah Benoît", email: "sarah.benoit@staffsync.io", roleId: "site", scope: { kind: "site", ids: ["pv"] }, lastActive: "2026-10-13T11:05", status: "active" },
  { id: "u6", name: "Hugo Martel", email: "hugo.martel@staffsync.io", roleId: "site", scope: { kind: "site", ids: ["pd", "cf"] }, lastActive: "2026-10-09T15:20", status: "active" },
  { id: "u7", name: "Lucie Perrin", email: "lucie.perrin@staffsync.io", roleId: "payroll", scope: company, lastActive: "2026-10-02T09:00", status: "active" },
  { id: "u8", name: "Théo Gauthier", email: "theo.gauthier@acme-hr.fr", roleId: "hr", scope: company, lastActive: null, status: "invited" },
  { id: "u9", name: "Camille Duval", email: "camille.duval@staffsync.io", roleId: "viewer", scope: { kind: "branch", ids: ["lyon"] }, lastActive: "2026-08-21T10:00", status: "revoked" },
];
