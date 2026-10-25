import type { Org } from "@/lib/org";
import { JOB_TITLES } from "@/data/employees";
import type { AppStatus, Employee, EmployeeDraft, EmployeeStatus, JobTitle, LeavePolicy } from "@/types/employee";

export interface EmployeeFilters {
  query: string;
  branch: string;
  site: string;
  title: "all" | JobTitle;
  status: "all" | EmployeeStatus;
  smartphone: "all" | "yes" | "no";
}

export const DEFAULT_EMPLOYEE_FILTERS: EmployeeFilters = { query: "", branch: "all", site: "all", title: "all", status: "all", smartphone: "all" };

export const hasActiveFilter = (f: EmployeeFilters): boolean => JSON.stringify(f) !== JSON.stringify(DEFAULT_EMPLOYEE_FILTERS);

export function filterEmployees(list: Employee[], f: EmployeeFilters, siteIds: string[]): Employee[] {
  const q = f.query.trim().toLowerCase().replace(/\s/g, "");
  return list.filter(
    (e) =>
      e.siteIds.some((s) => siteIds.includes(s)) &&
      (f.branch === "all" || e.branchId === f.branch) &&
      (f.site === "all" || e.siteIds.includes(f.site)) &&
      (f.title === "all" || e.title === f.title) &&
      (f.status === "all" || e.status === f.status) &&
      (f.smartphone === "all" || (f.smartphone === "yes") === (e.app !== "none")) &&
      (!q || e.name.toLowerCase().replace(/\s/g, "").includes(q) || e.id.toLowerCase().includes(q) || e.phone.replace(/\s/g, "").includes(q)),
  );
}

export const initialsOf = (name: string): string => {
  const w = name.split(" ");
  return (w[0][0] + (w[1]?.[0] ?? "")).toUpperCase();
};

export const attendanceTone = (rate: number): "ok" | "warn" | "bad" => (rate >= 90 ? "ok" : rate >= 75 ? "warn" : "bad");

export const appTone: Record<AppStatus, "ok" | "info" | "neutral"> = { installed: "ok", invited: "info", none: "neutral" };
export const statusTone: Record<EmployeeStatus, "ok" | "info" | "neutral"> = { active: "ok", invited: "info", deactivated: "neutral" };

// ---------------------------------------------------------------- CSV import

export const IMPORT_FIELDS = [
  { key: "name", required: true },
  { key: "id", required: true },
  { key: "phone", required: false },
  { key: "branch", required: true },
  { key: "site", required: true },
  { key: "title", required: true },
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];

/** Column index in the file for each field, or "" when skipped. */
export type ColumnMap = Record<ImportField, number | "">;
export const DEFAULT_MAP: ColumnMap = { name: 0, id: 1, phone: 2, branch: 3, site: 4, title: 5 };

export const CSV_HEADERS = ["Full name", "Employee ID", "Phone", "Branch", "Site", "Job title"];
export const CSV_TEMPLATE = "Full name,Employee ID,Phone,Branch,Site,Job title\nJane Doe,E-3001,06 00 00 00 00,Lyon,Part-Dieu Tower,cleaner";
export const SAMPLE_CSV: string[][] = [
  ["Julie Perrin", "E-2001", "06 11 22 33 44", "Lyon", "Part-Dieu Tower", "cleaner"],
  ["Antoine Mercier", "E-2002", "06 55 66 77 88", "Paris Nord", "Saint-Denis Hub", "driver"],
  ["", "E-2003", "06 12 12 12 12", "Lyon", "Confluence Depot", "technician"],
  ["Lucie Faure", "E-1042", "06 98 76 54 32", "Marseille", "Port Vieux Yard", "loader"],
  ["Rayan Said", "E-2005", "0612", "Paris Nord", "Roissy Logistics", "machinist"],
  ["Eva Blanc", "E-2006", "06 40 50 60 70", "Lyon", "Gare Nord Annex", "inspector"],
  ["Noé Carpentier", "E-2007", "06 21 31 41 51", "Marseille", "Port Vieux Yard", "astronaut"],
  ["Manon Robin", "E-2008", "06 61 71 81 91", "Lyon", "Part-Dieu Tower", "electrician"],
];

export type RowErrorKey = "nameRequired" | "idRequired" | "idExists" | "phoneInvalid" | "unknownSite" | "unknownTitle";
export interface RowError {
  key: RowErrorKey;
  value?: string;
}
export interface PreviewRow {
  line: number;
  name: string;
  id: string;
  phone: string;
  branch: string;
  site: string;
  title: string;
  errors: RowError[];
}

export function validateRows(rows: string[][], map: ColumnMap, existingIds: string[], org: Org): PreviewRow[] {
  const taken = new Set(existingIds);
  const seen = new Set<string>();
  const siteNames = org.sites.map((s) => s.name);
  const cell = (r: string[], key: ImportField) => (map[key] === "" ? "" : (r[map[key]] ?? "").trim());
  return rows.map((r, i) => {
    const row: PreviewRow = { line: i + 1, name: cell(r, "name"), id: cell(r, "id"), phone: cell(r, "phone"), branch: cell(r, "branch"), site: cell(r, "site"), title: cell(r, "title"), errors: [] };
    if (!row.name) row.errors.push({ key: "nameRequired" });
    if (!row.id) row.errors.push({ key: "idRequired" });
    else if (taken.has(row.id) || seen.has(row.id)) row.errors.push({ key: "idExists", value: row.id });
    seen.add(row.id);
    if (row.phone && row.phone.replace(/\D/g, "").length < 10) row.errors.push({ key: "phoneInvalid", value: row.phone });
    if (row.site && !siteNames.includes(row.site)) row.errors.push({ key: "unknownSite", value: row.site });
    if (row.title && !JOB_TITLES.includes(row.title as JobTitle)) row.errors.push({ key: "unknownTitle", value: row.title });
    return row;
  });
}

export function rowToEmployee(p: PreviewRow, org: Org): Employee {
  const site = org.sites.find((s) => s.name === p.site);
  const branchId = org.branches.find((b) => b.name === p.branch)?.id ?? site?.branchId ?? org.branches[0]?.id ?? "";
  return {
    id: p.id, name: p.name, branchId, siteIds: site ? [site.id] : [], title: (p.title as JobTitle) || "cleaner", phone: p.phone || "—",
    app: p.phone ? "invited" : "none", attendance: 0, status: "invited", access: "employee", contract: "cdi", startDate: new Date().toISOString().slice(0, 10), selfie: "inherit",
  };
}

/** The fields the server needs to create an employee from an imported row. */
export function draftFromEmployee(e: Employee): EmployeeDraft {
  const smartphone = e.app !== "none";
  return {
    id: e.id, name: e.name, branchId: e.branchId, siteIds: e.siteIds, title: e.title, phone: e.phone === "—" ? "" : e.phone, email: e.email, smartphone, invite: smartphone,
    access: e.access, contract: e.contract, startDate: e.startDate, selfie: e.selfie,
  };
}

/** How much of each leave type's yearly allowance a contract policy grants (1 = the full allowance). */
const POLICY_SHARE: Record<LeavePolicy, Record<string, number>> = {
  std: {},
  part: { annual: 0.8, rtt: 0 },
  fixed: { annual: 0.1, rtt: 0, sick: 0.6, family: 0.5 },
};

/** Starting leave balances for a policy, based on the leave types set up in Settings. */
export function policyBalances(policy: LeavePolicy, types: { id: string; allowance: number }[]): Record<string, number> {
  const share = POLICY_SHARE[policy];
  return Object.fromEntries(types.map((t) => [t.id, Math.round(t.allowance * (share[t.id] ?? 1) * 10) / 10]));
}
