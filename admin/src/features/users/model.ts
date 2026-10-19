import { useTranslations } from "next-intl";
import { BRANCHES, SITES, siteById } from "@/data/org";
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
  return {
    name: (r: AccessRole) => (r.builtIn ? t(`${r.id}.name`) : r.name),
    desc: (r: AccessRole) => (r.builtIn ? t(`${r.id}.desc`) : r.desc),
  };
}

export const branchName = (id: string) => BRANCHES.find((b) => b.id === id)?.name ?? id;

/** Short scope description for the users table; the tooltip lists everything. */
export function useScopeText() {
  const t = useTranslations("Users.scopeLabel");
  return {
    label: (s: DashboardUser["scope"]) => {
      if (s.kind === "company") return t("company");
      const one = s.ids.length === 1;
      if (s.kind === "branch") return one ? branchName(s.ids[0]) : t("branches", { count: s.ids.length });
      return one ? siteById(s.ids[0]).name : t("sites", { count: s.ids.length });
    },
    tip: (s: DashboardUser["scope"]) =>
      s.kind === "company" ? t("everything") : s.kind === "branch" ? s.ids.map(branchName).join(", ") : s.ids.map((id) => siteById(id).name).join(", "),
  };
}

export const SITE_OPTIONS = SITES.map((s) => ({ id: s.id, name: s.name }));
export const BRANCH_OPTIONS = BRANCHES.map((b) => ({ id: b.id, name: b.name }));
