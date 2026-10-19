import type { AdminPage, Identity, Permissions, Role, Scope } from "@/types/auth";

const NONE: Permissions = {
  admin: false, edit: false, behalf: false, review: false, approve: false,
  org: false, reports: false, users: false, settings: false, audit: false,
};

const BY_ROLE: Record<Role, Permissions> = {
  admin: { admin: true, edit: true, behalf: true, review: true, approve: true, org: true, reports: true, users: true, settings: true, audit: true },
  branch: { ...NONE, edit: true, behalf: true, review: true, approve: true, org: true, reports: true, users: true },
  site: { ...NONE, behalf: true },
};

export const DEFAULT_SCOPE: Record<Role, Scope> = {
  admin: { kind: "company" },
  branch: { kind: "branch", id: "pn" },
  site: { kind: "site", id: "pd" },
};

/** Who the demo roles sign in as. */
export const IDENTITY: Record<Role, Identity> = {
  admin: { name: "Claire Vasseur", email: "claire@batiplus.fr" },
  branch: { name: "Marc Olivier", email: "marc.olivier@batiplus.fr" },
  site: { name: "Nadia Koné", email: "nadia.kone@batiplus.fr" },
};

/** Sites each role may ever see. The scope switcher narrows within this list. */
export const ROLE_SITES: Record<Role, string[]> = {
  admin: ["pd", "cf", "sd", "rl", "pv"],
  branch: ["sd", "rl"],
  site: ["pd"],
};

export const permissionsFor = (role: Role): Permissions => BY_ROLE[role];

/** Whether a role may open a page. The profile page is always allowed. */
export function canAccess(p: Permissions, page: AdminPage): boolean {
  switch (page) {
    case "sites":
      return p.admin || p.org;
    case "reports":
      return p.reports;
    case "users":
      return p.admin || p.users;
    case "audit":
      return p.admin;
    case "settings":
      return p.admin || p.settings;
    default:
      return true;
  }
}
