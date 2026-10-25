/** Translation key under `Employees.titles`. */
export type JobTitle =
  | "machinist" | "forkliftOperator" | "cleaner" | "technician" | "electrician" | "driver" | "loader" | "inspector" | "siteManager";

export type AppStatus = "installed" | "invited" | "none";
export type EmployeeStatus = "active" | "invited" | "deactivated";
export type AccessRole = "employee" | "teamLead" | "siteManager" | "branchManager" | "admin";
export type Contract = "cdi" | "cdd" | "interim" | "intern" | "part";
export type LeavePolicy = "std" | "part" | "fixed";

export interface Employee {
  /** "E-1042" */
  id: string;
  name: string;
  branchId: string;
  /** Assigned sites; the first one is the default site. */
  siteIds: string[];
  title: JobTitle;
  /** Display phone, or "—" when the employee has none. */
  phone: string;
  email?: string;
  app: AppStatus;
  /** Attendance rate this month, 0–100. */
  attendance: number;
  status: EmployeeStatus;
  access: AccessRole;
  contract: Contract;
  startDate: string;
  selfie: "inherit" | "on" | "off";
  /** 4-digit PIN for employees without a smartphone. */
  pin?: string;
}

/** Fields collected by the add/edit form. */
export interface EmployeeDraft {
  id: string;
  name: string;
  branchId: string;
  siteIds: string[];
  title: JobTitle;
  phone: string;
  email?: string;
  smartphone: boolean;
  invite: boolean;
  access: AccessRole;
  contract: Contract;
  startDate: string;
  selfie: Employee["selfie"];
}
