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

/** The branch a branch manager runs and the site a site manager is assigned to in the demo. */
export const ROLE_BRANCH = "pn";
export const ROLE_SITE = "pd";

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

/** Page and action permissions implied by a role's permission list (see `lib/access-catalog.ts`). */
export function permissionsFromList(perms: string[], isAdmin: boolean): Permissions {
  const has = (k: string) => perms.includes(k);
  return {
    admin: isAdmin,
    edit: has("att.edit"),
    behalf: has("proxy.create"),
    review: has("fraud.approve"),
    approve: has("lva.approve"),
    org: has("site.view") || has("branch.view"),
    reports: has("rep.view"),
    users: has("usr.view"),
    settings: has("set.view") || has("bill.view"),
    audit: has("audit.view"),
  };
}
