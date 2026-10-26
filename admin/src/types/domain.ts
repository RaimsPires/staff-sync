/** Latitude and longitude in degrees. */
export type LatLng = [number, number];

export type Geofence = { kind: "circle"; radius: number } | { kind: "polygon"; points: LatLng[]; hectares: number };

export interface Branch {
  id: string;
  name: string;
  siteIds: string[];
}

export interface Site {
  id: string;
  name: string;
  branchId: string;
  address: string;
  position: LatLng;
  geofence: Geofence;
  manager: string;
  phone: string;
  /** Today's headcount figures. */
  expected: number;
  present: number;
  late: number;
  absent: number;
  flagged: number;
  leave: number;
}

/** Translation key under `Data.jobs`. */
export type JobKey =
  | "electrician" | "carpenter" | "plumber" | "cleaningAgent" | "forkliftOperator" | "nightGuard"
  | "warehouseClerk" | "logisticsAgent" | "orderPicker" | "dockSupervisor" | "driver" | "craneOperator"
  | "safetyInspector" | "rigger" | "siteTechnician" | "dockAgent";

export type RecordStatus =
  | "ontime" | "late" | "early" | "absent" | "missing" | "overtime" | "leave" | "holiday" | "flagged" | "scheduled";

/** app = employee phone, qr = site kiosk, behalf = site manager proxy, admin = dashboard correction. */
export type CheckMethod = "app" | "qr" | "behalf" | "admin" | "";

export type FlagKind = "dist" | "mock";

export type ScheduleKind = "recurring" | "recurringN" | "intervention";

export interface RecordEdit {
  by: string;
  at: string;
}

export interface AttendanceRecord {
  id: number;
  /** Employee id (the record id for today's records). */
  emp: number;
  name: string;
  job: JobKey;
  site: string;
  /** "08:00–17:00" */
  sched: string;
  kind: ScheduleKind;
  in: string;
  out: string;
  worked: string;
  status: RecordStatus;
  method: CheckMethod;
  /** Day of October 2026 for history rows. */
  date?: number;
  flag?: FlagKind;
  /** Distance from the geofence, e.g. "412 m". */
  dist?: string;
  lateBy?: number;
  offline?: boolean;
  edit?: RecordEdit | null;
  cleared?: boolean;
  fraud?: boolean;
  proxyBy?: string;
  /** Who approved the record and when, once approved. */
  approved?: string;
  approvedAt?: string;
  /** Reason entered when the record was created by hand. */
  manualReason?: string;
  evidence?: { name: string; size: number }[];
}

/** One field changed by an admin; kept in the record's edit history. */
export interface FieldChange {
  /** Translation key under `Drawer.fields`, or free text for status labels. */
  field: "status" | "checkIn" | "checkOut" | "record";
  from: string;
  to: string;
}

export interface HistoryEntry {
  by: string;
  at: string;
  changes: FieldChange[];
  reason: string;
}

export interface RecordNote {
  by: string;
  at: string;
  text: string;
}

export interface UnscheduledCheckIn {
  id: number;
  name: string;
  site: string;
  time: string;
}

export interface UncoveredIntervention {
  id: number;
  site: string;
  /** Interventions are described by key plus parameters, see `Data.interventions`. */
  kind: "nightSecurity" | "inventory" | "liftInspection";
  time: string | "yesterday";
}

