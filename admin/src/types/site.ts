import type { Geofence, LatLng } from "./domain";

export interface ManagedSite {
  id: string;
  name: string;
  code: string;
  branchId: string;
  address: string;
  timezone: string;
  position: LatLng;
  geofence: Geofence;
  managers: string[];
  phone: string;
  /** Employees assigned to the site. */
  employees: number;
  /** Today's headcount figures; the dashboard and attendance read them. */
  expected: number;
  present: number;
  late: number;
  absent: number;
  flagged: number;
  leave: number;
  requireSelfie: boolean;
  requireQr: boolean;
  registeredDeviceOnly: boolean;
  allowOffline: boolean;
  /** Minimum GPS accuracy in meters. */
  minAccuracy: number;
  active: boolean;
  hours: { start: string; end: string; breakMinutes: number };
}

export interface ManagedBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  timezone: string;
  admins: string[];
  holidays: "fr" | "alsace" | "be" | "custom";
  workflow: "default" | "single" | "two" | "auto";
  /** Attendance rate this month, 0 for a branch without data. */
  rate: number;
  archived: boolean;
}
