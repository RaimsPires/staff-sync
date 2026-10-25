import { useTranslations } from "next-intl";
import { useOrg } from "@/lib/org";
import type { AccessRole, DashboardUser } from "@/types/users";

const ROLE_TONES = [
  "bg-info-bg text-info", "bg-violet-bg text-violet", "bg-orange-bg text-orange",
  "bg-ok-bg text-ok", "bg-warn-bg text-warn", "bg-neutral-bg text-neutral",
] as const;

/** Colour of a role pill: stable per position in the roles list. */
export function roleTone(roles: AccessRole[], id: string): string {
  const i = roles.findIndex((r) => r.id === id);
  return ROLE_TONES[(i < 0 ? 5 : i) % ROLE_TONES.length];
}

/** Built-in roles are translated; custom roles show what their author typed. */
export function useRoleText() {
  const t = useTranslations("Users.defaultRoles");
  // Built-in roles from the server map onto the translated defaults that exist; others show the server's text.
  const id = (r: AccessRole): string | null => {
    const key = r.key ? KEY_TO_DEFAULT[r.key] : r.id;
    return r.builtIn && key && t.has(`${key}.name`) ? key : null;
  };
  return {
    name: (r: AccessRole) => (id(r) ? t(`${id(r)}.name`) : r.name),
    desc: (r: AccessRole) => (id(r) ? t(`${id(r)}.desc`) : r.desc),
  };
}

const KEY_TO_DEFAULT: Record<string, string> = { owner: "admin", branch_admin: "branch", site_manager: "site", viewer: "viewer" };

/** Short scope description for the users table; the tooltip lists everything. */
export function useScopeText() {
  const org = useOrg();
  const branchName = (id: string) => org.branchById(id)?.name ?? id;
  const t = useTranslations("Users.scopeLabel");
  return {
    label: (s: DashboardUser["scope"]) => {
      if (s.kind === "company") return t("company");
      const one = s.ids.length === 1;
      if (s.kind === "branch") return one ? branchName(s.ids[0]) : t("branches", { count: s.ids.length });
      return one ? org.siteById(s.ids[0]).name : t("sites", { count: s.ids.length });
    },
    tip: (s: DashboardUser["scope"]) =>
      s.kind === "company" ? t("everything") : s.kind === "branch" ? s.ids.map(branchName).join(", ") : s.ids.map((id) => org.siteById(id).name).join(", "),
  };
}

/** Branches and sites a role can be scoped to, for pickers. */
export function useScopeOptions() {
  const org = useOrg();
  return {
    sites: org.sites.map((s) => ({ id: s.id, name: s.name })),
    branches: org.branches.map((b) => ({ id: b.id, name: b.name })),
    branchName: (id: string) => org.branchById(id)?.name ?? id,
    siteName: (id: string) => org.siteById(id).name,
  };
}
