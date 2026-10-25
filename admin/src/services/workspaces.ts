import type { CompanyBrief } from "@/store/auth";
import type { Workspace } from "@/types/workspace";

/** Companies the user can open in the dashboard (employee-only memberships belong to the phone app). */
export function toWorkspaces(companies: CompanyBrief[]): Workspace[] {
  return companies
    .filter((c) => c.role !== "employee")
    .map((c) => ({
      id: c.id,
      name: c.name,
      mono: c.initials,
      logo: c.color,
      role: c.role === "site_manager" ? "site" : "admin",
    }));
}
