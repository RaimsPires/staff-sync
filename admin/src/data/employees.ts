import type { AppStatus, Employee, EmployeeStatus, JobTitle } from "@/types/employee";

type Seed = [id: string, name: string, branch: string, sites: string[], title: JobTitle, phone: string, app: AppStatus, attendance: number, status: EmployeeStatus];

const SEEDS: Seed[] = [
  ["E-1042", "Amélie Fontaine", "pn", ["sd"], "machinist", "06 12 45 78 01", "installed", 96, "active"],
  ["E-1043", "Karim Benali", "pn", ["rl", "sd"], "forkliftOperator", "06 23 11 90 42", "installed", 88, "active"],
  ["E-1044", "Léa Moreau", "lyon", ["pd"], "cleaner", "06 78 20 14 55", "installed", 93, "active"],
  ["E-1045", "Thomas Girard", "lyon", ["cf"], "technician", "06 45 67 12 03", "installed", 81, "active"],
  ["E-1046", "Inès Haddad", "mrs", ["pv"], "electrician", "06 90 12 33 71", "installed", 98, "active"],
  ["E-1047", "Paul Lambert", "pn", ["sd"], "driver", "06 31 88 20 17", "installed", 74, "active"],
  ["E-1048", "Sofia Rossi", "pn", ["rl"], "loader", "06 55 41 09 26", "installed", 91, "active"],
  ["E-1049", "Hugo Petit", "pn", ["sd"], "machinist", "06 02 64 18 80", "installed", 85, "active"],
  ["E-1050", "Nora Diallo", "lyon", ["cf", "pd"], "inspector", "06 71 30 55 92", "installed", 100, "active"],
  ["E-1051", "Yanis Boucher", "pn", ["sd"], "machinist", "06 83 27 41 63", "invited", 0, "invited"],
  ["E-1052", "Camille Roux", "pn", ["rl"], "loader", "06 14 92 70 38", "invited", 0, "invited"],
  ["E-1053", "Mehdi Cherif", "lyon", ["pd"], "technician", "06 66 05 83 29", "invited", 0, "invited"],
  ["E-1054", "Elena Marchand", "lyon", ["cf"], "cleaner", "06 49 18 62 07", "installed", 89, "active"],
  ["E-1055", "Bastien Leroy", "mrs", ["pv"], "driver", "06 27 74 15 90", "installed", 79, "active"],
  ["E-1056", "Georges Aubert", "lyon", ["pd"], "cleaner", "—", "none", 92, "active"],
  ["E-1057", "Monique Vidal", "mrs", ["pv"], "cleaner", "—", "none", 95, "active"],
  ["E-1058", "Damien Lopez", "lyon", ["pd"], "cleaner", "06 38 52 11 74", "installed", 64, "deactivated"],
  ["E-1059", "Chloé Garnier", "lyon", ["cf"], "technician", "06 99 07 46 18", "installed", 58, "deactivated"],
  ["E-1060", "Marc Olivier", "pn", ["sd", "rl"], "siteManager", "06 20 81 37 52", "installed", 99, "active"],
];

export const EMPLOYEES: Employee[] = SEEDS.map(([id, name, branchId, siteIds, title, phone, app, attendance, status]) => ({
  id, name, branchId, siteIds, title, phone, app, attendance, status,
  access: title === "siteManager" ? "siteManager" : "employee",
  contract: "cdi",
  startDate: "2024-03-04",
  selfie: "inherit",
  pin: app === "none" ? String(1000 + ((Number(id.slice(2)) * 37) % 9000)) : undefined,
}));

/** Employee seats included in the current plan. */
export const PLAN_LIMIT = 20;

export const JOB_TITLES: JobTitle[] = ["machinist", "forkliftOperator", "cleaner", "technician", "electrician", "driver", "loader", "inspector", "siteManager"];
